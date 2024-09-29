// src/components/ChatInput.tsx
import React from "react";
import styles from "./ChatInput.module.css"; // Import CSS module for styling

interface ChatInputProps {
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleChat: () => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat, handleKeyDown }) => {
  const isDisabled = chatInput.trim() === "";

  return (
    <div className={styles.container}>
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className={styles.textarea}
        rows={3} // Adjust rows as needed
      />
      <button
        onClick={handleChat}
        disabled={isDisabled}
        className={`${styles.button} ${isDisabled ? styles.buttonDisabled : ""}`}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
