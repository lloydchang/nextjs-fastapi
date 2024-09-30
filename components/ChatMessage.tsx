// components/ChatMessage.tsx
import React from 'react';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  sender: 'user' | 'bot'; // Define the sender type to match the Message interface
  text: string;
  isInterim: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim }) => {
  return (
    <div className={`${styles.chatMessage} ${sender === 'user' ? styles.user : styles.bot}`}>
      <p className={`${styles.messageText} ${isInterim ? styles.interim : ''}`}>
        {text}
      </p>
    </div>
  );
};

export default ChatMessage;
