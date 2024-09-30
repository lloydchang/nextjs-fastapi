// hooks/useChat.ts

import { useState, useCallback, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatService';
import { Message } from '../types/message';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationContext, setConversationContext] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isInterim),
        { sender: 'user', text: input, isInterim: false },
      ]);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await sendMessageToChatbot(
          'Your system prompt here', // Replace with your actual system prompt
          input,
          conversationContext,
          (botResponse: string, newContext: string | null) => {
            if (newContext !== null) {
              setConversationContext(newContext);
            }

            // Split the bot's response based on punctuation and whitespace
            const responseMessages = botResponse
              .split(/(?<=[.!?])\s+/) // Split after punctuation followed by whitespace
              .map((text) => text.trim())
              .filter((text) => text.length > 0);

            setMessages((prev) => [
              ...prev,
              ...responseMessages.map((text) => ({
                sender: 'bot',
                text,
                isInterim: false,
              })),
            ]);
          },
          abortController.signal
        );
      } catch (error) {
        console.error('Error communicating with chatbot:', error);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Sorry, I could not process your request.',
            isInterim: false,
          },
        ]);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [conversationContext, setMessages]
  );

  return {
    messages,
    setMessages,
    sendActionToChatbot,
  };
};
