// hooks/useChat.ts

import { useState, useCallback } from 'react';

interface Message {
  sender: string;
  text: string;
  isInterim: boolean;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      // Add user's message to messages state
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: input, isInterim: false },
      ]);

      try {
        // Send message to chatbot API
        // Replace this with your actual API call
        const botResponse = await fakeChatbotAPI(input);

        // Add bot's response to messages state
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: botResponse, isInterim: false },
        ]);
      } catch (error) {
        console.error('Error communicating with chatbot:', error);
        // Optionally, you can add an error message to the chat
      }
    },
    [setMessages]
  );

  return {
    messages,
    sendActionToChatbot,
  };
};

// Mock chatbot API function
const fakeChatbotAPI = async (input: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Echo: ${input}`);
    }, 1000);
  });
};
