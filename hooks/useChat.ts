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

      // Initialize the chatbot's message in the state with an empty string to update in real-time
      let chatbotMessageIndex: number;
      setMessages((prev) => {
        chatbotMessageIndex = prev.length; // Capture the index of the new message
        return [...prev, { sender: "TEDxSDG", text: "" }]; // Add an empty message for the bot's response
      });

      // Read the response as a stream of data
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      // Process the response stream in real-time
      while (reader && !done) {
        const { value, done: streamDone } = await reader.read();

        // Decode and parse the chunk of data received
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean); // Split by new lines and filter out empty lines

        // Handle each line (could be partial or complete JSON objects)
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.trim());

            if (parsed.response) {
              // Update the current chatbot message in real-time as chunks arrive
              setMessages((prev) => {
                const updatedMessages = [...prev];
                updatedMessages[chatbotMessageIndex] = {
                  ...updatedMessages[chatbotMessageIndex],
                  text: (updatedMessages[chatbotMessageIndex].text + parsed.response).trim(), // Concatenate the text
                };
                return updatedMessages;
              });
            }

            // Check if the stream is finished
            if (parsed.done) {
              done = true;
              console.log("Full response received: ", parsed);
            }
          } catch (e) {
            console.error("Failed to parse line: ", line);
          }
        }

        // Exit loop if the stream is marked as done
        if (streamDone) break;
      }
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
