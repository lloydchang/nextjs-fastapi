// components/ChatInput.tsx

import React from 'react';
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

  const sendMessage = () => {
    if (!isDisabled) {
      handleChat();
      setChatInput(''); // Clear the input field after sending
    }
  };

  return (
    <div className={styles.container}>
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent adding a new line
            sendMessage();
          }
        }}
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

export default React.memo(ChatInput);
