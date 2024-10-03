// hooks/useChat.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { initiateChat } from '../services/chatService'; // Correctly import initiateChat

export interface Message {
  id: string;
  sender: string;
  text: string;
  isInterim?: boolean;
}

interface UseChatProps {
  isMemOn: boolean;
}

export const useChat = ({ isMemOn }: UseChatProps) => {
  const LOCAL_STORAGE_KEY = 'chatMemory';
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentContext, setCurrentContext] = useState<string | null>(null);
  const isSendingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMemOn) {
      const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
        console.log('Chat history loaded from memory.');
      }
    } else {
      setMessages([]);
    }
  }, [isMemOn]);

  useEffect(() => {
    if (isMemOn && messages.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
      console.log('Chat history saved to memory.');
    }
  }, [messages, isMemOn]);

  const getConversationContext = useCallback((): string => {
    return messagesRef.current
      .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');
  }, []);

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      if (isSendingRef.current) {
        console.warn('A message is already being processed. Please wait.');
        return;
      }

      console.log("Processing new message:", input);
      const newMessageId = `${Date.now()}-${Math.random()}`;
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);
      isSendingRef.current = true;

      try {
        const fullContext = getConversationContext();
        await initiateChat(input, fullContext, (message, newContext) => {
          const replyId = `${Date.now()}-${Math.random()}`;
          setMessages((prev) => [...prev, { id: replyId, sender: 'bot', text: message }]);
          setCurrentContext(newContext);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error communicating with chatbot:', errorMessage);
        setMessages((prev) => [
          ...prev,
          { id: `error-${Date.now()}`, sender: 'bot', text: `Error: ${errorMessage}` },
        ]);
      } finally {
        isSendingRef.current = false;
      }
    },
    [getConversationContext]
  );

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    setCurrentContext(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log('Chat history cleared from memory.');
  }, []);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory };
};
