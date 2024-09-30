// hooks/useChat.ts

import { useState, useCallback, useRef } from 'react';
import { sendMessageToChatbot } from '../services/chatService'; // Import the function
import { Message } from '../types/message'; // Adjust the path if necessary

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationContext, setConversationContext] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendActionToChatbot = useCallback(
    async (input: string) => {
      // Add user's message to messages state, removing any interim messages
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isInterim),
        { sender: 'user', text: input, isInterim: false },
      ]);

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

            // Update messages state with partial response
            setMessages((prev) => {
              const lastBotMessageIndex = prev
                .slice()
                .reverse()
                .findIndex((msg) => msg.sender === 'bot');

              if (lastBotMessageIndex !== -1) {
                const index = prev.length - 1 - lastBotMessageIndex;
                const updatedMessage = {
                  ...prev[index],
                  text: prev[index].text + messageSegment,
                };
                return [...prev.slice(0, index), updatedMessage, ...prev.slice(index + 1)];
              } else {
                // Add new bot message
                return [...prev, { sender: 'bot', text: messageSegment, isInterim: false }];
              }
            });
          },
          abortController.signal // Pass the abort signal
        );
      } catch (error) {
        console.error('Error communicating with chatbot:', error);
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Sorry, I could not process your request.', isInterim: false },
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
