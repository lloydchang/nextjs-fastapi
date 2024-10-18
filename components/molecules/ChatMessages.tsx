// File: components/molecules/ChatMessages.tsx

import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';
import ChatMessage from 'components/atoms/ChatMessage';
import styles from 'styles/components/molecules/ChatMessages.module.css';
import { Message } from 'types';

interface ChatMessagesProps {
  isFullScreen: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ isFullScreen }) => {
  // Access Redux state directly
  const messages = useSelector((state: RootState) => state.chat.messages);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        console.debug('Scrolled to the bottom of the messages container.');
      });
    }
  }, [messages]);

  // Log messages whenever Redux state updates
  useEffect(() => {
    console.debug('ChatMessages - Received messages from Redux:', messages);
  }, [messages]);

  // Log when rendering chat messages
  useEffect(() => {
    console.debug('Rendering chat messages:', messages);
  }, [messages]);

  return (
    <div className={styles.messagesContainer} ref={messagesContainerRef}>
      {messages
        .filter((msg) => msg.hidden === false || msg.hidden === undefined) // Show non-hidden or undefined messages
        .map((msg: Message, index: number) => {
          console.debug('Rendering message:', msg); // Log each message being rendered
          return (
            <ChatMessage
              key={msg.id}
              id={msg.id} // Ensure the id is passed down
              sender={msg.sender}
              text={typeof msg.text === 'string' ? msg.text : ''} // Default to empty string if text is not a string
              persona={msg.persona}
              isInterim={msg.isInterim} // Include isInterim if available
              role={msg.role} // Add the missing role property
              content={msg.content} // Add the missing content property
              isFullScreen={isFullScreen} // Pass the isFullScreen prop to each ChatMessage
              timestamp={msg.timestamp} // Pass the timestamp prop to ChatMessage
            />
          );
        })}
    </div>
  );
};

export default React.memo(ChatMessages);
