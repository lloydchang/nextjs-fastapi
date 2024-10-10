// File: components/molecules/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store'; // Ensure this path is correct
import ChatMessage from 'components/atoms/ChatMessage'; // Ensure this path is correct
import styles from 'styles/components/molecules/ChatMessages.module.css'; // Ensure this path is correct

const ChatMessages: React.FC = () => {
  // Access Redux state directly
  const messages = useSelector((state: RootState) => state.chat.messages);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages]);

  // Log messages whenever Redux state updates
  useEffect(() => {
    console.log('ChatMessages - Received messages from Redux:', messages);
  }, [messages]);

  return (
    <div className={styles.messagesContainer} ref={messagesContainerRef}>
      {messages
        .filter((msg) => msg.hidden === false || msg.hidden === undefined) // Show non-hidden or undefined messages
        .map((msg) => (
          <ChatMessage
            key={msg.id}
            sender={msg.sender}
            text={typeof msg.text === 'string' ? msg.text : ''} // Default to empty string if text is not a string
            persona={msg.persona}
          />
        ))}
    </div>
  );
};

export default React.memo(ChatMessages);
