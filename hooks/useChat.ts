// hooks/useChat.ts
import { useState } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingInputs, setPendingInputs] = useState<string[]>([]); // Store pending inputs
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Track if processing is ongoing

  const processPendingInputs = async () => {
    setIsProcessing(true); // Mark as processing

    while (pendingInputs.length > 0) {
      const input = pendingInputs.shift(); // Get the first input
      if (input) {
        setMessages((prev) => [...prev, { sender: 'user', text: input }]);
        
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
        }
      }
    }

    setIsProcessing(false); // Mark processing as done
  };

  const sendActionToChatbot = (input: string) => {
    setPendingInputs((prev) => [...prev, input]); // Add input to pending inputs
    if (!isProcessing) {
      processPendingInputs(); // Start processing if not already processing
    }
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

  return { messages, sendActionToChatbot, startHearing, stopHearing };
};
