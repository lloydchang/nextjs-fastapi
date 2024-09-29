// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const debounceTimeout = 300; // Time in ms to wait before sending

  useEffect(() => {
    if (pendingInput && !isSending) {
      const timer = setTimeout(() => {
        sendActionToChatbot(pendingInput);
        setPendingInput(null); // Clear the input after sending
      }, debounceTimeout);
      return () => clearTimeout(timer);
    }
  }, [pendingInput, isSending]);

  const sendActionToChatbot = async (input: string) => {
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    setIsSending(true); // Set sending state to true

    try {
      // Using the updated chat service function
      const responseMessage = await sendMessageToChatbot(systemPrompt, input);
      setMessages((prev) => [...prev, { sender: 'TEDxSDG', text: responseMessage }]);
    } catch (error) {
      console.error('Error sending message to chatbot:', error); // Log the error
      setMessages((prev) => [
        ...prev,
        { sender: 'TEDxSDG', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsSending(false); // Reset sending state
    }
  };

  // Function to handle user input
  const handleUserInput = (input: string) => {
    setPendingInput(input); // Set the input to be sent after debounce
  };

  // Function to start hearing (implementation details depend on your application)
  const startHearing = () => {
    // Logic to start hearing (e.g., enable microphone input)
    console.log('Hearing started');
  };

  // Function to stop hearing
  const stopHearing = () => {
    // Logic to stop hearing (e.g., disable microphone input)
    console.log('Hearing stopped');
  };

  return { messages, handleUserInput, startHearing, stopHearing };
};
