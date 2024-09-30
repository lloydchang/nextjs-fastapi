// components/ChatInput.tsx

import React, { useCallback } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleChat: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  chatInput,
  setChatInput,
  handleChat,
}) => {
  const isDisabled = chatInput.trim() === '';

  const sendMessage = useCallback(() => {
    if (!isDisabled) {
      handleChat();
      setChatInput(''); // Clear the input field after sending
    }
  }, [isDisabled, handleChat, setChatInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      sendMessage();
    }
  }, [sendMessage]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
  }, [setChatInput]);

  return (
    <div className={styles.container}>
      <textarea
        value={chatInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className={styles.textarea}
        rows={3}
      />
      <button
        onClick={sendMessage}
        disabled={isDisabled}
        className={`${styles.button} ${isDisabled ? styles.buttonDisabled : ''}`}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(ChatInput);
