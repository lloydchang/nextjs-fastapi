// src/hooks/useChat.ts
import { useState } from "react";

interface Message {
  sender: string;
  text: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendActionToChatbot = async (input: string) => {
    // Add the user's message
    setMessages(prev => [...prev, { sender: "user", text: input }]);

    // Simulate chatbot response (replace with actual API call)
    const response = await mockChatbotResponse(input);

    // Add the chatbot's response
    setMessages(prev => [...prev, { sender: "TEDxSDG", text: response }]);
  };

  return { messages, sendActionToChatbot };
};

// Mock chatbot response (replace with actual API integration)
const mockChatbotResponse = async (input: string): Promise<string> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`You said: "${input}". This is a simulated response.`);
    }, 1000);
  });
};
