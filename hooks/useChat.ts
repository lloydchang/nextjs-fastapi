// hooks/useChat.ts
import { useState, useCallback } from 'react';
import { Message } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendActionToChatbot = useCallback(async (userMessage: string) => {
    try {
      // Simulate sending message to chatbot and receiving a response
      const botResponse = await mockSendToChatbot(userMessage);
      
      const botMessage: Message = {
        id: generateUniqueId(),
        type: 'bot',
        text: botResponse,
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      // Optionally, handle error by adding an error message to the chat
      const errorMessage: Message = {
        id: generateUniqueId(),
        type: 'bot',
        text: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  }, []);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendActionToChatbot,
    clearChatHistory,
  };
};

// Mock function to simulate chatbot response
const mockSendToChatbot = (message: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Bot response to "${message}"`);
    }, 1000); // Simulate network delay
  });
};

// Utility to generate unique IDs
const generateUniqueId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
