// src/components/ChatMessages.tsx
import React from "react";
import ChatMessage from "./ChatMessage";
import styles from "./ChatMessages.module.css"; // Import CSS module for styling

interface ChatMessagesProps {
  messages: { sender: string; text: string }[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <p className={styles.placeholder}>No messages yet.</p>
      ) : (
        messages.map((msg, index) => (
          <ChatMessage key={index} sender={msg.sender} text={msg.text} />
        ))
      )}
    </div>
  );
};

export default ChatMessages;
