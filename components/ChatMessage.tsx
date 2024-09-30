// components/ChatMessage.tsx

import React from "react";
import styles from "./ChatMessage.module.css"; // Import CSS module for styling

interface ChatMessageProps {
  sender: string;
  text: string;
  isInterim?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text, isInterim }) => {
  const isUser = sender.toLowerCase() === "user";

  return (
    <div
      className={`${styles.messageContainer} ${
        isUser ? styles.user : styles.bot
      } ${isInterim ? styles.interim : ""}`} // Apply interim style if isInterim is true
    >
      <div className={styles.messageBubble}>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
