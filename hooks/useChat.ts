// hooks/useChat.ts

import { useState } from 'react';
import { useTalkContext } from '../context/TalkContext';

export const useChat = () => {
  const { transcript } = useTalkContext(); // Access the transcript from context
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);

  const sendActionToChatbot = async (message: string) => {
    // Logic for sending the message to the chatbot
    // You might want to add handling for the transcript here
  };

  // Function to send the transcript if it exists
  const sendTranscript = () => {
    if (transcript) {
      const formattedTranscript = `📜 ${transcript}`; // Format the transcript
      setMessages((prev) => [...prev, { sender: 'user', text: formattedTranscript }]);
      sendActionToChatbot(formattedTranscript); // Send the formatted transcript
    }
  };

  return {
    messages,
    setMessages,
    sendActionToChatbot,
    sendTranscript, // Expose the sendTranscript function if needed
  };
};
