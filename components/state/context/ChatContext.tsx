// File: components/state/context/ChatContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { Message } from '../hooks/useChat'; // Ensure this path is correct
import { useChat } from '../hooks/useChat';

// Define the ChatContextProps type
interface ChatContextProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>; // Required property
  sendActionToChatbot: (input: string) => Promise<void>;  // Expect Promise<void> here
  clearChatHistory: () => void;
  isMemOn: boolean;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode; isMemOn: boolean }> = ({ children, isMemOn }) => {
  const chat = useChat({ isMemOn });

  // Check if setMessages is included in the returned chat object
  if (!chat.setMessages) {
    throw new Error('setMessages is required in the chat context.');
  }

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
