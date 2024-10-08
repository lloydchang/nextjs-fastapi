// File: components/state/hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isInterim?: boolean;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory';
  const { getItem, setItem, removeItem } = useLocalStorage(LOCAL_STORAGE_KEY);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const messageQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMemOn) {
      const storedMessages = getItem();
      if (storedMessages) {
        setMessages(storedMessages);
        console.log('useChat - Chat history loaded from memory.');
      }
    } else {
      setMessages([]);
    }
  }, [isMemOn, getItem]);

  useEffect(() => {
    if (isMemOn && messages.length > 0) {
      setItem(messages);
      console.log('useChat - Chat history saved to memory.');
    }
  }, [messages, isMemOn, setItem]);

  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    console.log('useChat - Starting to process the message queue.');

    while (messageQueueRef.current.length > 0) {
      const nextMessage = messageQueueRef.current.shift();
      if (nextMessage) {
        await sendMessage(nextMessage);
      }
    }

    isProcessingRef.current = false;
    console.log('useChat - Message queue processing complete.');
  }, []);

  const sendMessage = useCallback(
    async (input: string) => {
      const newMessageId = `${Date.now()}-${Math.random()}`;
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);
      console.log(`useChat - Sending message: ${input}`);
  
      try {
        const messagesArray = messagesRef.current.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));
  
        messagesArray.push({ role: 'user', content: input.trim() });
  
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messagesArray }),
        });
  
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let chunk;
          let textBuffer = ''; // Buffer to hold the text data
  
          while ((chunk = await reader.read()) && !chunk.done) {
            textBuffer += decoder.decode(chunk.value, { stream: true });
  
            // Split by double newline (indicating the end of a data chunk)
            const messages = textBuffer.split('\n\n').filter((msg) => msg.trim() !== '');
  
            // Process each complete message
            for (const message of messages) {
              if (message.startsWith('data: ')) {
                const jsonString = message.substring(6).trim();
                try {
                  const parsedData = JSON.parse(jsonString);
  
                  if (parsedData.message && parsedData.persona) {
                    console.log(`Incoming message from persona: ${parsedData.persona}`);
  
                    // Include persona in the message text
                    const formattedMessage = `${parsedData.persona}: ${parsedData.message}`;
                    setMessages((prev) => [
                      ...prev,
                      { id: `${Date.now()}-${Math.random()}`, sender: 'bot', text: formattedMessage },
                    ]);
                  }
                } catch (e) {
                  console.warn('useChat - Could not parse incoming event message:', jsonString);
                }
              }
            }
  
            // Reset buffer after processing complete messages
            textBuffer = textBuffer.endsWith('\n\n') ? '' : textBuffer.split('\n\n').slice(-1)[0];
          }
        }
      } catch (error) {
        console.error(`useChat - Error generating content from API: ${error}`);
      }
    },
    [getConversationContext]
  );

  // Define `sendActionToChatbot` to handle messages added to the queue
  const sendActionToChatbot = useCallback(
    async (input: string): Promise<void> => {
      if (!input.trim()) {
        console.warn('useChat - Ignoring empty input.');
        return;
      }

      messageQueueRef.current.push(input);
      console.log(`useChat - Added message to queue: ${input}`);
      await processQueue();
    },
    [processQueue]
  );

  // Function to clear chat history from state and local storage
  const clearChatHistory = useCallback(() => {
    setMessages([]);
    try {
      removeItem();
      console.log('useChat - Chat history cleared from memory.');
    } catch (error) {
      console.error('useChat - Failed to clear chat history from memory:', error);
    }
  }, [removeItem]);

  return { messages, sendActionToChatbot, clearChatHistory, isMemOn };
};
