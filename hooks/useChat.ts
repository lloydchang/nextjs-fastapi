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
      // Create the request body to match the expected format
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

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Read the response as a stream of data
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";
      let done = false;

      // Process the response stream
      while (reader && !done) {
        const { value, done: streamDone } = await reader.read();

        // Decode and parse the chunk of data received
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        // Handle each line (could be partial or complete JSON objects)
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.trim());

            if (parsed.response) {
              // Accumulate response text from the stream
              fullResponse += parsed.response;
            }

            // Check if the stream is finished
            if (parsed.done) {
              done = true;
              // Add any final details or context if needed
              console.log("Full response received: ", parsed);
            }
          } catch (e) {
            console.error("Failed to parse line: ", line);
          }
        }

        // Exit loop if the stream is marked as done
        if (streamDone) break;
      }

      // Add the final accumulated response to the state
      setMessages((prev) => [...prev, { sender: "TEDxSDG", text: fullResponse || "No response received." }]);
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
