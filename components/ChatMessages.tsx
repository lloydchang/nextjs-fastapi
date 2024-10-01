// components/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import { Message } from '../hooks/useChat';
import styles from '../styles/ChatMessages.module.css';

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  // Create a reference for the messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.messagesContainer} ref={messagesContainerRef}>
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
