// components/molecules/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import { Message } from '../hooks/useChat';
import styles from '../../styles/components/molecules/ChatMessages.module.css';

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  // Create a reference for the messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change
  useEffect(() => {
    const container = messagesContainerRef.current;

    // Use requestAnimationFrame for smoother scroll update
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages]);

  // Use an additional useEffect to handle initial page load and container height adjustment
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.height = '90vh'; // Ensure it uses the defined height
    }
  }, []);

  return (
    <div className={styles.messagesContainer} ref={messagesContainerRef}>
      {messages.map((msg, index) => {
        // Determine if a message is interim and only render it conditionally
        const isInterim = msg.isInterim && msg.sender === 'user';

        return (
          <div
            key={index}
            className={`${styles.message} ${
              msg.sender === 'user' ? styles.userMessage : styles.botMessage
            } ${isInterim ? styles.interim : ''}`}
          >
            <span className={styles.text}>{msg.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(ChatMessages);
