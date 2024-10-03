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
  const [currentContext, setCurrentContext] = useState<string | null>(null);
  const isSendingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      if (isSendingRef.current) {
        console.warn('A message is already being processed. Please wait.');
        return;
      }

      const newMessageId = `${Date.now()}-${Math.random()}`;
      setMessages((prev) => [...prev, { id: newMessageId, sender: 'user', text: input }]);
      isSendingRef.current = true;

      try {
        const fullContext = getConversationContext();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: input.trim(), context: fullContext }),
        });

        const data = await response.json();
        console.log('API Response:', data); // Debug log

        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.message) {
              const replyId = `${Date.now()}-${Math.random()}`;
              setMessages((prev) => [...prev, { id: replyId, sender: 'bot', text: item.message }]);
              setCurrentContext(item.context);
            }
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { id: `error-${Date.now()}`, sender: 'bot', text: `Error: ${data.message || 'Unexpected response format'}` },
          ]);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { id: `error-${Date.now()}`, sender: 'bot', text: `Error: ${error.message || 'Unknown error occurred'}` },
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
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Chat history cleared from memory.');
    } catch (error) {
      console.error('Failed to clear chat history from memory:', error);
    }
  }, []);

  return { messages, setMessages, sendActionToChatbot, clearChatHistory };
};
