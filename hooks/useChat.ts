// hooks/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatService';
import { Message } from '../types/message'; // Importing the correct Message interface

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationContext, setConversationContext] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isInterim),
        { sender: 'user' as const, text: input, isInterim: false }, // Explicitly set sender as 'user'
      ]);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await sendMessageToChatbot(
          input,
          conversationContext,
          (botResponse: string, newContext: string | null) => {
            if (newContext !== null) {
              setConversationContext(newContext);
            }

            // Split the bot's response into sentences
            const sentences = botResponse
              .split(/(?<=[.!?])(?=[^\s])/g) // Split after punctuation if followed by a non-space character
              .map((sentence) => sentence.trim())
              .filter((sentence) => sentence.length > 0);

            // Use type assertions to ensure correct typing for `sender`
            setMessages((prev) => [
              ...prev,
              ...sentences.map((sentence) => ({
                sender: 'bot' as const, // Explicitly set sender as 'bot'
                text: sentence,
                isInterim: false,
              })),
            ]);
          }
        ); // Correctly close the `await sendMessageToChatbot` call
      } catch (error) {
        console.error('Error communicating with chatbot:', error);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot' as const, // Ensure error message has the correct sender type
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
