// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { Message } from '../types/message'; // Ensure this path is correct
import { sendMessageToChatbot } from '../services/chatService'; // Import chat service
import { systemPrompt } from '../utils/systemPrompt'; // Import the system prompt

// Utility functions to handle local storage operations for saving and loading chat history
const saveChatHistory = (messages: Message[]) => {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
};

const loadChatHistory = (): Message[] => {
  const history = localStorage.getItem('chatHistory');
  return history ? JSON.parse(history) : [];
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>(loadChatHistory()); // Load chat history on initialization
  const [context, setContext] = useState<string | null>(null); // Store the context returned by the chatbot
  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(true); // Memory enabled by default

  // Save chat history whenever messages change and memory is enabled
  useEffect(() => {
    if (isMemoryEnabled) {
      saveChatHistory(messages);
    }
  }, [messages, isMemoryEnabled]);

  const sendActionToChatbot = async (input: string) => {
    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);

    // Create a conversation context string by concatenating all previous messages
    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n');

    try {
      await sendMessageToChatbot(
        systemPrompt,
        input,
        `${conversationHistory}\nuser: ${input}`, // Include the full conversation history
        (responseMessage, newContext) => {
          if (newContext) setContext(newContext);
          setMessages((prev) => [...prev, { sender: 'TEDxSDG', text: responseMessage }]);
        }
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'TEDxSDG', text: 'Sorry, something went wrong. Please try again.' },
      ]);
    }
  };

  // Corrected Toggle memory function
  const toggleMemory = () => {
    setIsMemoryEnabled((prev) => {
      const newMemoryState = !prev; // Get the new state value
      if (!newMemoryState) {
        localStorage.removeItem('chatHistory'); // Clear history if memory is disabled
        setMessages([]);
      }
      return newMemoryState;
    });
  };

  const startHearing = () => {
    console.log('Hearing started');
  };

  const stopHearing = () => {
    console.log('Hearing stopped');
  };

  return { messages, sendActionToChatbot, context, isMemoryEnabled, toggleMemory, startHearing, stopHearing };
};
