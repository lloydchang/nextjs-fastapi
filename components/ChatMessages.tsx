// components/ChatMessages.tsx
import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import styles from './ChatMessages.module.css';
import { Message } from '../types/message';

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
            sender={msg.sender} // Correctly pass the sender prop
            text={msg.text}     // Pass the text prop
            isInterim={msg.isInterim} // Pass the isInterim prop
          />
        ))
      )}
    </div>
  );
};

export default ChatMessages;
