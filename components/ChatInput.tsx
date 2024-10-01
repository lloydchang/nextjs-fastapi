// components/ChatInput.tsx
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
      isSendingRef.current = true;
      handleChat(true);
      setTimeout(() => (isSendingRef.current = false), 500); // Reset after 500ms
    }
  };

  const handleButtonClick = () => {
    if (!isSendingRef.current) {
      isSendingRef.current = true;
      handleChat(true);
      setTimeout(() => (isSendingRef.current = false), 500); // Reset after 500ms
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
