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
      // Create the request body to match the curl command format
      const requestBody = {
        model: "llama3.2",
        prompt: input,
      };

      console.log("Request Body: ", requestBody); // Log the request body for debugging

      // Make a POST request to the specified endpoint
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody), // Send the JSON request body
      });

      console.log("Response Status: ", response.status); // Log the response status

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Parse the response as JSON
      const data = await response.json();

      console.log("Response Data: ", data); // Log the full response data for inspection

      // Extract the chatbot's response text
      const chatbotResponse = data?.result ?? "No response from the server.";

      // Add the chatbot's response to the state
      setMessages((prev) => [...prev, { sender: "TEDxSDG", text: chatbotResponse }]);
    } catch (error) {
      console.error("Error occurred: ", error); // Log the actual error

      // Handle error scenarios (e.g., network or API issues)
      setMessages((prev) => [
        ...prev,
        { sender: "TEDxSDG", text: "Sorry, something went wrong. Please try again." },
      ]);
    }
  };

  return { messages, sendActionToChatbot };
};
