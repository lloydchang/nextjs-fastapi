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
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      // Make an API call to the specified endpoint
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: input, // Send user's message as the prompt
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Parse the response as JSON
      const data = await response.json();

      // Extract the chatbot's response text
      const chatbotResponse = data?.result ?? "No response from the server.";

      // Add the chatbot's response to the state
      setMessages((prev) => [...prev, { sender: "TEDxSDG", text: chatbotResponse }]);
    } catch (error) {
      // Handle error scenarios (e.g., network or API issues)
      setMessages((prev) => [
        ...prev,
        { sender: "TEDxSDG", text: "Sorry, something went wrong. Please try again." },
      ]);
    }
  };

  return { messages, sendActionToChatbot };
};
