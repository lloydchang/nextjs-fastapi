// hooks/useChat.ts
import { useState } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]); // Store chat messages

  const sendActionToChatbot = async (input: string) => {
    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);

    try {
      // Using the updated chat service function
      const responseMessage = await sendMessageToChatbot(systemPrompt, input);
      // Add bot response to chat
      setMessages((prev) => [...prev, { sender: 'TEDxSDG', text: responseMessage }]);
    } catch (error) {
      console.error('Error sending message to chatbot:', error); // Log the error
      setMessages((prev) => [
        ...prev,
        { sender: 'TEDxSDG', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    }
  };

  // Function to start hearing (implementation details depend on your application)
  const startHearing = () => {
    console.log('Hearing started');
  };

  // Function to stop hearing
  const stopHearing = () => {
    console.log('Hearing stopped');
  };

  return { messages, sendActionToChatbot, startHearing, stopHearing };
};
