// components/ChatInput.tsx

import React from 'react';
import styles from '../styles/ChatInput.module.css';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleChat();
    }
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
      <button type="button" onClick={handleChat} className={styles.sendButton}>
        Send
      </button>
    </div>
  );
};

export default React.memo(ChatInput);
