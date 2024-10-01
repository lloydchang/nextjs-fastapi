// hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatService'; // Import the chat service

export interface Message {
  sender: string;
  text: string;
  isInterim?: boolean;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory'; // Local storage key for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentContext, setCurrentContext] = useState<string | null>(null); // Track context as a full string

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

  // Helper function to construct conversation context
  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  // Send user message to the chatbot and receive a response
  const sendActionToChatbot = useCallback(
    async (input: string) => {
      setMessages((prev) => [...prev, { sender: 'user', text: input }]);

      try {
        console.log('Sending prompt to chatbot service:', input);
        const fullContext = getConversationContext(); // Include full context each time
        const reply = await sendMessageToChatbot(input, fullContext, (message, newContext) => {
          // Update state with the new context and add message
          setMessages((prev) => [...prev, { sender: 'bot', text: message }]);
          setCurrentContext(newContext);
        });

        // Handle the non-streaming response mode
        if (reply) setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error communicating with chatbot:', errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Error: ${errorMessage}`, // Format the error message for display
          },
        ]);
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
