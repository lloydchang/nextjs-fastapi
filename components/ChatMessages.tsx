// components/ChatMessages.tsx

import React from 'react';
import { Message } from '../hooks/useChat';
import styles from '../styles/ChatMessages.module.css';

interface ChatMessagesProps {
  messages: Message[];
}

// Removed
//         <span className={styles.sender}>{msg.sender === 'user' ? 'You' : 'Bot'}:</span>

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <div className={styles.messagesContainer}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`${styles.message} ${
            msg.sender === 'user' ? styles.userMessage : styles.botMessage
          }`}
        >
          <span className={styles.text}>{msg.text}</span>
        </div>
      ))}
    </div>
  );
};

export default React.memo(ChatMessages);
