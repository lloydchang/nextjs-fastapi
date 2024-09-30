// hooks/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatService'; // Ensure correct path
import { Message } from '../types/message'; // Define your message type here

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
          input, // Only pass input now
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

            setMessages((prev) => [
              ...prev,
              ...sentences.map((sentence) => ({
                sender: 'bot',
                text: sentence,
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
