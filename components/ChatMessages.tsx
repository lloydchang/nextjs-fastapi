// components/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import styles from '../styles/ChatMessages.module.css';
import { Message } from '../hooks/useChat';

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages are updated
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.container} ref={containerRef}>
      {messages.length === 0 ? (
        <p className={styles.placeholder}>No messages yet.</p>
      ) : (
        messages.map((msg, index) => (
          <ChatMessage
            key={index}
            sender={msg.sender}
            text={msg.text}
            isInterim={msg.isInterim}
          />
        ))
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(ChatMessages);
