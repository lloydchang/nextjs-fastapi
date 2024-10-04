// File: hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory';
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const messageQueueRef = useRef<string[]>([]); // Queue to hold messages

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMemOn) {
      try {
        const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages) as Message[];
          setMessages(parsedMessages);
          console.log('Chat history loaded from memory.');
        }
      } catch (error) {
        console.error('Failed to load chat history from memory:', error);
      }
    } else {
      setMessages([]);
    }
  }, [isMemOn]);

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

  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    const newMessageId = `${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);

    try {
      const messagesArray = messagesRef.current.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

      // Add the current user input to the messages array
      messagesArray.push({
        role: 'user',
        content: input.trim(),
      });

      console.log('Sending request to API:', {
        messages: messagesArray,
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesArray, // Send only messages, no model
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (data.message) {
        const replyId = `${Date.now()}-${Math.random()}`;
        setMessages((prev) => [...prev, { id: replyId, sender: 'bot', text: data.message }]);
      } else {
        throw new Error(data.message || 'Unexpected response format');
      }
    } catch (error) {
      console.error('Error generating content from API:', {
        input: input.trim(),
        error: JSON.stringify(error, null, 2),
      });
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, sender: 'bot', text: `Error: ${error.message || 'Unknown error occurred'}` },
      ]);
    }
  }, [getConversationContext]);

  const sendActionToChatbot = useCallback((input: string) => {
    if (!input.trim()) return;

    messageQueueRef.current.push(input); // Add the input to the queue
    // Process messages in the queue immediately
    while (messageQueueRef.current.length > 0) {
      const nextMessage = messageQueueRef.current.shift(); // Get the next message from the queue
      if (nextMessage) {
        sendMessage(nextMessage); // Send the message immediately
      }
    }
  }, [sendMessage]);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Chat history cleared from memory.');
    } catch (error) {
      console.error('Failed to clear chat history from memory:', error);
    }
  }, []);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory };
};
