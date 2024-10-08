// File: components/state/hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { z } from 'zod'; // For runtime type checking

// Define a schema for incoming messages that allows for multi-line content
const IncomingMessageSchema = z.object({
  persona: z.string(),
  message: z.string()
});

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

  // Use a ref for the decoder to avoid recreating it on each render
  const decoderRef = useRef(new TextDecoder());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMemOn) {
      const storedMessages = getItem();
      if (storedMessages) {
        setMessages(storedMessages);
      }
    } else {
      setMessages([]);
    }
  }, [isMemOn, getItem]);

  useEffect(() => {
    if (isMemOn && messages.length > 0) {
      setItem(messages);
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

    try {
      while (messageQueueRef.current.length > 0) {
        const nextMessage = messageQueueRef.current.shift();
        if (nextMessage) {
          await sendMessage(nextMessage);
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const sendMessage = useCallback(
    async (input: string) => {
      const newMessageId = `${Date.now()}-${Math.random()}`;
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);

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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (reader) {
          let textBuffer = '';
          let jsonBuffer = '';
          let isInJson = false;

          const processBuffer = () => {
            const lines = textBuffer.split('\n');
            textBuffer = '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonString = line.substring(6).trim();
                if (jsonString === '{') {
                  isInJson = true;
                  jsonBuffer = '{';
                } else if (jsonString === '}') {
                  isInJson = false;
                  jsonBuffer += '}';
                  try {
                    const parsedData = IncomingMessageSchema.parse(JSON.parse(jsonBuffer));
                    const formattedMessage = `${parsedData.persona}: ${parsedData.message.trim()}`;
                    setMessages((prev) => [
                      ...prev,
                      { id: `${Date.now()}-${Math.random()}`, sender: 'bot', text: formattedMessage },
                    ]);
                  } catch (e) {
                    console.error('Error parsing incoming event message:', jsonBuffer, e);
                  }
                  jsonBuffer = '';
                } else if (isInJson) {
                  jsonBuffer += jsonString;
                }
              } else {
                textBuffer += line + '\n';
              }
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            textBuffer += decoderRef.current.decode(value, { stream: true });
            processBuffer();
          }

          // Process any remaining data in the buffer
          processBuffer();
        }
      } catch (error) {
        console.error(`Error generating content from API:`, error);
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, sender: 'bot', text: 'Sorry, an error occurred. Please try again.' },
        ]);
      }
    },
    [getConversationContext]
  );

  const sendActionToChatbot = useCallback(
    async (input: string): Promise<void> => {
      if (!input.trim()) return;

      messageQueueRef.current.push(input);
      await processQueue();
    },
    [processQueue]
  );

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    try {
      removeItem();
    } catch (error) {
      console.error('Failed to clear chat history from memory:', error);
    }
  }, [removeItem]);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory, isMemOn };
};