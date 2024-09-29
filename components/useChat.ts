// src/components/useChat.ts
import { useState } from "react";

interface Message {
  sender: string;
  text: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendActionToChatbot = async (input: string) => {
    // Add the user's message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: input },
    ]);

    try {
      // Simulate sending the message to a chatbot and receiving a response
      const response = await mockChatbotResponse(input);

      // Add the chatbot's response to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "TEDxSDG", text: response },
      ]);
    } catch (error) {
      console.error("Error communicating with chatbot:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "TEDxSDG", text: "Sorry, I couldn't process that." },
      ]);
    }
  };

  return { messages, sendActionToChatbot };
};

// Mock chatbot response function (replace with actual API integration)
const mockChatbotResponse = async (input: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`You said: "${input}". This is a simulated response.`);
    }, 1000); // Simulate network delay
  });
};
