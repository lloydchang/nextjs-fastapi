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

  // Function to handle sending messages to the chatbot
  const sendActionToChatbot = async (input: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const requestBody = { model: "llama3.2", prompt: input };
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      let chatbotMessageIndex: number;
      setMessages((prev) => {
        chatbotMessageIndex = prev.length;
        return [...prev, { sender: "TEDxSDG", text: "" }];
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (reader && !done) {
        const { value, done: streamDone } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

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
            if (parsed.done) done = true;
          } catch (e) {
            console.error("Failed to parse line: ", line);
          }
        }
        if (streamDone) break;
      }
    } catch (error) {
      console.error("Error occurred: ", error);
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
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setMessages((prev) => [...prev, { sender: "user", text: event.results[i][0].transcript }]);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { sender: "user", text: interimTranscript },
          ]);
        }
      };

      recognition.onend = () => {
        setIsHearingOn(false);
        setIsRecognitionRunning(false); // Reset the recognition running flag on end
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsHearingOn(false);
        setIsRecognitionRunning(false); // Reset the flag on error
      };
    } else {
      console.error("SpeechRecognition API is not supported in this browser.");
    }
  }, []);

  return { messages, sendActionToChatbot, startHearing, stopHearing, isHearingOn };
};
