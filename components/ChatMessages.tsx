// components/ChatMessages.tsx

import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import styles from "./ChatMessages.module.css"; // Import CSS module for styling
import { Message } from "../types/message"; // Ensure correct path

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null); // Ref to the chat container

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
            isInterim={msg.isInterim} // Pass the isInterim property
          />
        ))
      )}
    </div>
  );
};

export default ChatMessages;
