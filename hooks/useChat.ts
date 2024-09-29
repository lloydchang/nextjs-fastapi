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
      // Step 1: Log the input message
      alert(`Sending user message: ${input}`);

      // Construct query parameters for the GET request
      const url = new URL("http://localhost:11434/api/generate");
      url.searchParams.append("model", "llama3.2");
      url.searchParams.append("prompt", input);

      alert(`Constructed URL: ${url.toString()}`); // Show constructed URL as an alert

      // Step 2: Check before the fetch call
      alert("Starting the fetch call...");

      // Make the GET request to the specified endpoint
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      alert(`Response Status: ${response.status}`); // Log the response status as an alert

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Parse the response as JSON
      const data = await response.json();

      alert(`Response Data: ${JSON.stringify(data)}`); // Display response data as an alert

      // Extract the chatbot's response text
      const chatbotResponse = data?.result ?? "No response from the server.";

      // Step 3: Confirm successful response
      alert(`Chatbot Response: ${chatbotResponse}`);

      // Add the chatbot's response to the state
      setMessages((prev) => [...prev, { sender: "TEDxSDG", text: chatbotResponse }]);
    } catch (error) {
      alert(`Error occurred: ${error.message}`); // Show the error message as an alert
      console.error("Error occurred: ", error); // Log the actual error to console for visibility

      // Handle error scenarios (e.g., network or API issues)
      setMessages((prev) => [
        ...prev,
        { sender: "TEDxSDG", text: "Sorry, something went wrong. Please try again." },
      ]);
    }
  };

  return { messages, sendActionToChatbot };
};
