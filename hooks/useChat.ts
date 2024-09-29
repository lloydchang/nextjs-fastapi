// src/hooks/useChat.ts

import { useState, useEffect, useRef } from "react";

// Define the interface for message structure
interface Message {
  sender: string;
  text: string;
}

// Custom hook to manage chat messages and interactions with the chatbot
export const useChat = () => {
  // State to keep track of all chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHearingOn, setIsHearingOn] = useState(false); // State to control the hearing status
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false); // Track if recognition is already running
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Reference to the SpeechRecognition instance

  // System prompt for the chatbot to set the context
  const systemPrompt = "You are TEDxSDG, an AI assistant that helps users connect their ideas to sustainable development goals (SDGs) and provides guidance on actionable steps.";

  // Function to handle sending messages to the chatbot
  const sendActionToChatbot = async (input: string) => {
    // Append the user message to the chat
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      // Prepare request to chatbot backend with system prompt and user input
      const requestBody = { 
        model: "llama3.2", 
        prompt: `${systemPrompt}\nUser: ${input}\nAssistant:` 
      };
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Handle non-200 HTTP status codes
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      // Variable to keep track of the chatbot message index in the state
      let chatbotMessageIndex: number;

      // Append a placeholder for the chatbot's response
      setMessages((prev) => {
        chatbotMessageIndex = prev.length;
        return [...prev, { sender: "TEDxSDG", text: "" }];
      });

      // Use streams to read the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      // Parse the streaming response and update the message text
      while (reader && !done) {
        const { value, done: streamDone } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean); // Split response into lines

        // Iterate through each line and update the message state accordingly
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.trim());
            if (parsed.response) {
              setMessages((prev) => {
                const updatedMessages = [...prev];
                updatedMessages[chatbotMessageIndex] = {
                  ...updatedMessages[chatbotMessageIndex],
                  text: (updatedMessages[chatbotMessageIndex].text + parsed.response).trim(),
                };
                return updatedMessages;
              });
            }
            // Mark as done if the response indicates completion
            if (parsed.done) done = true;
          } catch (e) {
            console.error("Failed to parse line: ", line);
          }
        }
        if (streamDone) break; // Exit loop if stream is finished
      }
    } catch (error) {
      console.error("Error occurred: ", error);
      // Display error message if request fails
      setMessages((prev) => [
        ...prev,
        { sender: "TEDxSDG", text: "Sorry, something went wrong. Please try again." },
      ]);
    }
  };

  // Function to start hearing using the Web Speech API
  const startHearing = () => {
    if (recognitionRef.current && !isRecognitionRunning) {
      recognitionRef.current.start();
      setIsHearingOn(true);
      setIsRecognitionRunning(true); // Set the recognition running flag
    }
  };

  // Function to stop hearing
  const stopHearing = () => {
    if (recognitionRef.current && isRecognitionRunning) {
      recognitionRef.current.stop();
      setIsHearingOn(false);
      setIsRecognitionRunning(false); // Reset the recognition running flag
    }
  };

  // Set up the SpeechRecognition instance
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // Initialize new SpeechRecognition instance and configure settings
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true; // Enable continuous listening mode
      recognition.interimResults = true; // Get partial results as the user speaks
      recognition.lang = "en-US"; // Set language to English

      // Handler for speech recognition results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            // Append final transcript to messages
            setMessages((prev) => [...prev, { sender: "user", text: event.results[i][0].transcript }]);
          } else {
            // Update interim transcript
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Update last message with interim transcript
        if (interimTranscript) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { sender: "user", text: interimTranscript },
          ]);
        }
      };

      // Handler for recognition end event
      recognition.onend = () => {
        setIsHearingOn(false);
        setIsRecognitionRunning(false); // Reset the recognition running flag on end
      };

      // Handler for recognition error event
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsHearingOn(false);
        setIsRecognitionRunning(false); // Reset the flag on error
      };
    } else {
      console.error("SpeechRecognition API is not supported in this browser.");
    }
  }, []);

  // Return state and handlers for external use
  return { messages, sendActionToChatbot, startHearing, stopHearing, isHearingOn };
};
