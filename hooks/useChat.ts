// hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
  id: string; // Add a unique ID for each message
  sender: 'user' | 'bot'; // Specify sender as 'user' or 'bot' for clarity
  text: string;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory'; // Local storage key for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentContext, setCurrentContext] = useState<string | null>(null); // Track context as a full string
  const isSendingRef = useRef(false); // Ref to track if a message is already being sent

  // Ref to hold the latest messages for context
  const messagesRef = useRef<Message[]>([]);

  // Update messagesRef whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load messages from localStorage when memory is enabled and component mounts
  useEffect(() => {
    if (isMemOn) {
      try {
        const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
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

  // Helper function to construct conversation context with clear delimiters
  const getConversationContext = useCallback((): string => {
    // Format the history part with markers
    const history = messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');

    return `### Conversation History:\n${history}`;
  }, []);

  // Send user message to the chatbot and receive a response
  const sendActionToChatbot = useCallback(
    async (input: string) => {
      if (isSendingRef.current) {
        console.warn('A message is already being processed. Please wait.');
        return; // Prevent multiple concurrent sends
      }

      console.log("Processing new message:", input);
      const newMessageId = `${Date.now()}-${Math.random()}`; // Create a unique ID
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);
      isSendingRef.current = true; // Set sending status

      try {
        console.log('Sending prompt to chatbot service:', input);
        const fullContext = getConversationContext(); // Include full context each time

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: input.trim(), context: fullContext }),
        });

        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const messagesChunk = chunk.split('\n').filter(Boolean);
            for (const msg of messagesChunk) {
              try {
                const parsed: { message: string; context: string | null } = JSON.parse(msg);
                if (parsed.message) {
                  const replyId = `${Date.now()}-${Math.random()}`; // Unique ID for bot message
                  setMessages((prev) => [...prev, { id: replyId, sender: 'bot', text: parsed.message }]);
                  setCurrentContext(parsed.context);
                }
              } catch (e) {
                console.error('Error parsing message:', msg, e);
              }
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error communicating with chatbot:', errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            sender: 'bot',
            text: `Error: ${errorMessage}`, // Format the error message for display
          },
        ]);
      } finally {
        isSendingRef.current = false; // Reset sending status
      }
    },
    [getConversationContext]
  );

  // Clear Chat History
  const clearChatHistory = useCallback(() => {
    setMessages([]);
    setCurrentContext(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Chat history cleared from memory.');
    } catch (error) {
      console.error('Failed to clear chat history from memory:', error);
    }
  }, []);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory };
};
