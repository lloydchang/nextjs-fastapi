// hooks/useChat.ts

import { useState, useEffect, useCallback } from 'react';
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
  const LOCAL_STORAGE_KEY = 'chatMemory'; // Local storage key for messages
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages from localStorage when memory is enabled and component mounts
  useEffect(() => {
    if (isMemOn) {
      try {
        const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
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
    if (isMemOn && messages.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
        console.log('Chat history saved to memory.');
      } catch (error) {
        console.error('Failed to save chat history to memory:', error);
      }
    }
  }, [messages, isMemOn]);

  // Send user message to the chatbot and receive a response
  const sendActionToChatbot = useCallback(
    async (input: string) => {
      // Add user message to the conversation first
      setMessages((prev) => [...prev, { sender: 'user', text: input }]);

      try {
        // Send the entire conversation to the chatbot for context-aware responses
        await sendMessageToChatbot(input, getConversationContext(), (reply, newContext) => {
          setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
          // Optionally, handle newContext if needed
        });
      } catch (error) {
        console.error('Error communicating with chatbot:', error);
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
      }
    },
    [messages] // Add messages as a dependency to capture the current state
  );

  // Helper function to construct conversation context
  const getConversationContext = useCallback((): string => {
    return messages
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, [messages]);

  return { messages, setMessages, sendActionToChatbot };
};
