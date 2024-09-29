// src/hooks/useChat.ts

import { useState } from "react";

// Define the interface for message structure
interface Message {
  sender: string;
  text: string;
}

// Custom hook to manage chat messages and interactions with the chatbot
export const useChat = () => {
  // State to keep track of all chat messages
  const [messages, setMessages] = useState<Message[]>([]);

  // Function to handle sending messages to the chatbot
  const sendActionToChatbot = async (input: string) => {
    // Add the user's message to the state
    setMessages(prev => [...prev, { sender: "user", text: input }]);

    // Placeholder for actual API call integration
    const response = await mockChatbotResponse(input);

    // Add the chatbot's response to the state
    setMessages(prev => [...prev, { sender: "TEDxSDG", text: response }]);
  };

  return { messages, sendActionToChatbot };
};

// Simulated response function to be replaced by actual API integration
const mockChatbotResponse = async (input: string): Promise<string> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(`You said: "${input}". This is a simulated response from TEDxSDG.`);
    }, 1000); // Delay of 1 second to mimic a real response time
  });
};
