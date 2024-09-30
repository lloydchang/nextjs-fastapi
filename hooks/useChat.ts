// hooks/useChat.ts

import { useState, useCallback, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatService'; // Ensure correct path
import { Message } from '../types/message';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationContext, setConversationContext] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const botResponseBufferRef = useRef<string>(''); // Buffer to accumulate bot's response

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      // Add user's message to messages state, removing any interim messages
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isInterim),
        { sender: 'user', text: input, isInterim: false },
      ]);

      // Reset bot response buffer
      botResponseBufferRef.current = '';

      // Abort any previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Call sendMessageToChatbot with system prompt, user input, context, and a callback
        await sendMessageToChatbot(
          'Your system prompt here', // Replace with your actual system prompt
          input,
          conversationContext,
          (messageSegment: string, newContext: string | null) => {
            // Update conversation context
            if (newContext !== null) {
              setConversationContext(newContext);
            }

            // Accumulate bot's response
            botResponseBufferRef.current += messageSegment;
          }
        );

        // After sendMessageToChatbot completes, split bot's response into sentences
        const fullBotResponse = botResponseBufferRef.current;

        // Split the bot's response based on punctuation marks
        const sentences = fullBotResponse
          .split(/(?<=[.!?])(?=[^\s])/g) // Split after punctuation if followed by non-space character
          .map((sentence) => sentence.trim())
          .filter((sentence) => sentence.length > 0);

        // Add sentences as separate messages
        setMessages((prev) => [
          ...prev,
          ...sentences.map((sentence) => ({
            sender: 'bot',
            text: sentence,
            isInterim: false,
          })),
        ]);
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
        // Clear the abort controller
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
