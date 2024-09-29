// src/components/ChatMessage.tsx
import React from "react";
import styles from "./ChatMessage.module.css"; // Import CSS module for styling

interface ChatMessageProps {
  sender: string;
  text: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text }) => {
  const isUser = sender.toLowerCase() === "user";

  return (
    <div
      className={`${styles.messageContainer} ${isUser ? styles.user : styles.bot}`}
    >
      <div className={styles.messageBubble}>
        <p>{text}</p> {/* Removed the <strong> element to avoid sender prefix */}
      </div>
    </div>
  );
};

export default ChatMessage;
