// File: components/atoms/ChatInput.tsx

import React, { useRef } from 'react';
import styles from '../styles/ChatInput.module.css';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: (isManual: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat }) => {
  const isSendingRef = useRef(false); // Prevent multiple sends

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSendingRef.current) {
      if (chatInput === '') return; // Do not send empty messages
      isSendingRef.current = true;
      handleChat(true);
      setChatInput(''); // Clear input immediately
      // Reset isSendingRef immediately
      isSendingRef.current = false;
    }
  };

  const handleButtonClick = () => {
    if (!isSendingRef.current && chatInput !== '') {
      isSendingRef.current = true;
      handleChat(true);
      setChatInput(''); // Clear input immediately
      // Reset isSendingRef immediately
      isSendingRef.current = false;
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
      <button type="button" onClick={handleButtonClick} className={styles.sendButton}>
        Send
      </button>
    </div>
  );
};

export default React.memo(ChatInput);
