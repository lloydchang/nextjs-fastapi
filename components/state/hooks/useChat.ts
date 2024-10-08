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
        console.log('useChat - Chat history loaded from memory:', storedMessages);
      }
    } else {
      setMessages([]);
    }
  }, [isMemOn, getItem]);

  useEffect(() => {
    if (isMemOn && messages.length > 0) {
      setItem(messages);
      console.log('useChat - Chat history saved to memory:', messages);
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
        console.log('useChat - Sending next message from queue:', nextMessage);
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
        console.log('useChat - Constructed messages array for API:', messagesArray);

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

            // Split by double newline to separate complete JSON chunks
            const completeMessages = textBuffer.split('\n\n').filter((msg) => msg.trim() !== '');

            // Process each complete message
            for (const message of completeMessages) {
              if (message.startsWith('data: ')) {
                const jsonString = message.substring(6).trim();
                console.log(`useChat - Raw incoming message: ${jsonString}`);

                try {
                  const parsedData = JSON.parse(jsonString);

                  if (parsedData.message && parsedData.persona) {
                    console.log(`useChat - Incoming message from persona: ${parsedData.persona}`);

                    // Clean the message text to handle special formatting or unwanted metadata
                    let cleanMessage = parsedData.message.split('**Explanation:**')[0].trim();
                    cleanMessage = cleanMessage.replace(/\n+/g, '\n'); // Normalize newlines

                    // Include persona in the message text
                    const formattedMessage = `${parsedData.persona}: ${cleanMessage}`;
                    console.log('useChat - Formatted incoming message:', formattedMessage);

                    // Ensure the message gets displayed correctly
                    setMessages((prev) => [
                      ...prev,
                      { id: `${Date.now()}-${Math.random()}`, sender: 'bot', text: formattedMessage },
                    ]);
                    console.log(`useChat - Updated messages: ${JSON.stringify(messagesRef.current)}`);
                  }
                } catch (e) {
                  console.error('useChat - Error parsing incoming event message:', jsonString, e);
                }
              }
            }

            // Update buffer: keep only the last incomplete message chunk
            textBuffer = textBuffer.endsWith('\n\n') ? '' : textBuffer.split('\n\n').slice(-1)[0];
          }
        }
      } catch (error) {
        console.error(`useChat - Error generating content from API: ${error}`);
      }
    },
    [getConversationContext]
  );

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

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    try {
      removeItem();
      console.log('useChat - Chat history cleared from memory.');
    } catch (error) {
      console.error('useChat - Failed to clear chat history from memory:', error);
    }
  }, [removeItem]);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory, isMemOn };
};

// Export the function so that it can be tested
export function parseIncomingMessage(jsonString: string) {
  try {
    // Attempt to parse the incoming JSON string
    const parsedData = JSON.parse(jsonString);

    // Validate that the parsedData has the expected fields
    if (!parsedData.persona || !parsedData.message) {
      console.error(`useChat - Incomplete message data received: ${jsonString}`);
      return null;
    }

    return parsedData;
  } catch (error) {
    // Log the error and raw JSON string for debugging
    console.error(`useChat - Error parsing incoming event message: ${jsonString}`, error);

    // Suggest possible cause of error
    if (jsonString.trim().endsWith('"')) {
      console.error('useChat - Possible unterminated JSON string detected.');
    } else {
      console.error('useChat - Check for special characters or invalid JSON format.');
    }
    return null;
  }
}
