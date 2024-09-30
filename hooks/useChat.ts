// hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Ref to hold the latest messages for context
  const messagesRef = useRef<Message[]>([]);

  // Update messagesRef whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load messages from localStorage when memory is enabled and component mounts
  useEffect(() => {
    if (isMemOn) {
      try {
        const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
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

  // Helper function to construct conversation context
  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  // Send user message to the chatbot and receive a response
  const sendActionToChatbot = useCallback(
    async (input: string) => {
      // Add user message to the conversation first
      setMessages((prev) => [...prev, { sender: 'user', text: input }]);

      try {
        // Send the entire conversation to the chatbot for context-aware responses
        const reply = await sendMessageToChatbot(input, getConversationContext());
        setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      } catch (error) {
        console.error('Error communicating with chatbot:', error);
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
      }
    },
    [getConversationContext]
  );

  // Erase Memory: Clear chat history from state and localStorage
  const eraseMemory = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Chat history erased from memory.');
    } catch (error) {
      console.error('Failed to erase chat history from memory:', error);
    }
  }, []);

  return { messages, setMessages, sendActionToChatbot, eraseMemory };
};
