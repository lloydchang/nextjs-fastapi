// components/ChatInput.tsx

import React from 'react';
import styles from '../styles/ChatInput.module.css';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: (isManual: boolean) => void; // Updated to accept `isManual` parameter
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat }) => {
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleChat(true); // Mark as manual when Enter is pressed
    }
  };

  // Handle Send button click
  const handleButtonClick = () => {
    handleChat(true); // Mark as manual when Send button is clicked
  };

  return (
    <div className={styles.inputContainer}>
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        className={styles.input}
      />
      <button type="button" onClick={handleButtonClick} className={styles.sendButton}>
        Send
      </button>
    </div>
  );
};

export default React.memo(ChatInput);
