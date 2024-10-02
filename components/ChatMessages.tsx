// components/ChatMessages.tsx
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import styles from '../styles/ChatMessages.module.css';

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.messagesContainer}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={
            msg.type === 'user' ? styles.userMessage : styles.botMessage
          }
        >
          {msg.text}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default React.memo(ChatMessages);
