// hooks/useChat.ts
import { useState } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]); // Store chat messages
  const [context, setContext] = useState<string | null>(null); // Store the context returned by the chatbot

  const sendActionToChatbot = async (input: string) => {
    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);

    // Create a conversation context string by concatenating all previous messages
    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n');

    try {
      // Stream the response messages along with full conversation history
      await sendMessageToChatbot(
        systemPrompt,
        input,
        `${conversationHistory}\nuser: ${input}`, // Include the full conversation history
        (responseMessage, newContext) => {
          console.log('Streaming response:', responseMessage); // Log each response message

          // Update context if a new one is received
          if (newContext) setContext(newContext);

          // Add bot response to chat as it streams in
          setMessages((prev) => [...prev, { sender: 'TEDxSDG', text: responseMessage }]);
        }
      );
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

  return { messages, sendActionToChatbot, context, startHearing, stopHearing };
};
