// File: components/state/hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isInterim?: boolean; // Add the isInterim property as optional
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory'; // Key for localStorage
  const [messages, setMessages] = useState<Message[]>([]); // State to hold chat messages
  const messagesRef = useRef<Message[]>([]); // Ref to always have the latest messages
  const messageQueueRef = useRef<string[]>([]); // Queue to manage outgoing messages
  const isProcessingRef = useRef(false); // Ref to indicate if the queue is being processed

  // Update messagesRef whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load messages from localStorage when memory is enabled
  useEffect(() => {
    if (isMemOn) {
      try {
        const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages) as Message[];
          setMessages(parsedMessages);
          console.log('Chat history loaded from memory.');
        }
      } catch (error) {
        console.error('Failed to load chat history from memory:', error);
      }
    } else {
      setMessages([]); // Clear messages if memory is turned off
    }
  }, [isMemOn]);

  // Save messages to localStorage whenever they change and memory is enabled
  useEffect(() => {
    if (isMemOn && messages.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
        console.log('Chat history saved to memory.');
      } catch (error) {
        console.error('Failed to save chat history to memory:', error);
      }
    }
  }, [messages, isMemOn]);

  // Helper function to construct the conversation context
  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  // Function to send a single message to the chatbot
  const sendMessage = useCallback(
    async (input: string) => {
      const newMessageId = `${Date.now()}-${Math.random()}`; // Generate a unique ID for the user message
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);

      try {
        const messagesArray = messagesRef.current.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

        // Add the current user input to the messages array
        messagesArray.push({
          role: 'user',
          content: input.trim(),
        });

        console.log('Sending request to API:', {
          messages: messagesArray,
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesArray, // Send only messages, no model
          }),
        });

        if (!response.ok) {
          // Parse the error response to extract message and details
          const errorData = await response.json();
          throw new Error(JSON.stringify({ message: errorData.error, details: errorData.details }));
        }

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        if (data.message) {
          const replyId = `${Date.now()}-${Math.random()}`; // Generate a unique ID for the bot reply
          setMessages((prev) => [...prev, { id: replyId, sender: 'bot', text: data.message }]);
        } else {
          throw new Error(data.message || 'Unexpected response format');
        }
      } catch (error) {
        // Error handling with type narrowing
        if (error instanceof Error) {
          console.error('Error generating content from API:', {
            input: input.trim(),
            error: error.message,
          });

          // Parse the error message to extract detailed information
          let parsedError;
          try {
            parsedError = JSON.parse(error.message);
          } catch (parseError) {
            parsedError = { message: 'Unknown error', details: 'Failed to parse server error.' };
          }

          // Separate chat bubbles for error and details
          const errorId = `error-${Date.now()}`;
          const detailsId = `details-${Date.now()}`;

          setMessages((prev) => [
            ...prev,
            {
              id: errorId,
              sender: 'bot',
              text: `Error: ${parsedError.message}`, // Error message bubble
            },
            {
              id: detailsId,
              sender: 'bot',
              text: `Details: ${parsedError.details}`, // Error details bubble
            },
          ]);
        } else {
          console.error('Unknown error occurred:', error);
        }
      }
    },
    [getConversationContext]
  );

  // Function to process the message queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return; // Prevent multiple processors
    isProcessingRef.current = true;
    console.log('Starting to process the message queue.');

    while (messageQueueRef.current.length > 0) {
      const nextMessage = messageQueueRef.current.shift(); // Get the next message from the queue
      if (nextMessage) {
        await sendMessage(nextMessage); // Wait for the message to be sent
      }
    }

    isProcessingRef.current = false;
    console.log('Message queue processing complete.');
  }, [sendMessage]);

  // Function to add a message to the queue and initiate processing
  const sendActionToChatbot = useCallback(
    async (input: string): Promise<void> => { // Ensure sendActionToChatbot returns a Promise<void>
      if (!input.trim()) return; // Ignore empty input

      messageQueueRef.current.push(input); // Add the input to the queue
      await processQueue(); // Wait for queue processing to complete
    },
    [processQueue]
  );

  // Function to clear chat history
  const clearChatHistory = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Chat history cleared from memory.');
    } catch (error) {
      console.error('Failed to clear chat history from memory:', error);
    }
  }, []);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory, isMemOn }; // Add isMemOn to the return value
};
