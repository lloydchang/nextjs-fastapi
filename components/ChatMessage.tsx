// components/ChatMessage.tsx

import React from 'react';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  sender: string;
  text: string;
  isInterim?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ sender, text, isInterim }) => {
  const isUser = sender.toLowerCase() === 'user';

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.user : styles.bot
      } ${isInterim ? styles.interim : ''}`}
      aria-live="polite"
    >
      <div className={styles.messageBubble}>
        <p>{text}</p>
      </div>
    </div>
  );
});

export default ChatMessage;
