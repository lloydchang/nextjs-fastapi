// File: components/atoms/ChatMessages.tsx

import React from 'react';
import styles from '../../styles/components/molecules/ChatMessages.module.css';
import ChatMessage from '../atoms/ChatMessage';

interface Message {
  id: string;
  sender: string;
  text: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <div className={styles.chatMessages}>
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          sender={message.sender}
          text={message.text}
        />
      ))}
    </div>
  );
};

export default React.memo(ChatMessages);
