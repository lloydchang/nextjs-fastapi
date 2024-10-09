// File: src/components/molecules/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import ChatMessage from '../atoms/ChatMessage'; // Import the ChatMessage component
import { Message } from '../state/hooks/useChat';
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
        container.scrollTop = container.scrollHeight; // Scroll to the bottom
      });
    }
  }, [messages]);

  // Initial load handling
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      // Immediately set opacity to 1 for visibility
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      // Ensure the container is scrollable
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight; // Scroll to the bottom on initial load
      });
    }
  }, []);

  return (
    <div className={styles.messagesContainer} ref={messagesContainerRef}>
      {messages.map((msg) => {
        const isInterim = msg.isInterim && msg.sender.toLowerCase() === 'user';

        return (
          <ChatMessage
            key={msg.id} // Use unique key from msg.id
            sender={msg.sender}
            text={msg.text}
            isInterim={isInterim}
          />
        );
      })}
    </div>
  );
};

export default React.memo(ChatMessages);
