// hooks/useChat.ts

import { useState, useEffect } from 'react';
import { sendMessageToChatbot } from '../services/chatService'; // Import the chat service

export interface Message {
  sender: string;
  text: string;
  isInterim?: boolean;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages from localStorage when memory is enabled and component mounts
  useEffect(() => {
    if (isMemOn) {
      try {
        const storedMessages = localStorage.getItem('chatMemory');
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
          console.log('Chat history loaded from memory.');
        }
      } catch (error) {
        console.error('Failed to load chat history from memory:', error);
      }
    } else {
      setMessages([]); // Clear messages if memory is turned off
    }
  }, [isMemOn]);

  // Save messages to localStorage whenever they change and memory is enabled
  useEffect(() => {
    if (isMemOn) {
      try {
        localStorage.setItem('chatMemory', JSON.stringify(messages));
        console.log('Chat history saved to memory.');
      } catch (error) {
        console.error('Failed to save chat history to memory:', error);
      }
    }
  }, [messages, isMemOn]);

  const sendActionToChatbot = async (input: string) => {
    try {
      // Send the entire conversation to the chatbot for context-aware responses
      await sendMessageToChatbot(input, getConversationContext(), (reply, newContext) => {
        setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
        // Optionally, update the context if needed
      });
    } catch (error) {
      console.error('Error communicating with chatbot:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    }
  };

  // Helper function to construct conversation context
  const getConversationContext = () => {
    return messages
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  };

  return { messages, setMessages, sendActionToChatbot };
};
