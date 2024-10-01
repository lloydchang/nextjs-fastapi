// components/ChatInput.tsx
import React from 'react';
import styles from '../styles/ChatInput.module.css';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: (isManual: boolean) => void; // Updated to accept `isManual` parameter
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat }) => {
  // Prevent multiple executions
  let isMessageBeingSent = false;

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isMessageBeingSent) {
      isMessageBeingSent = true; // Mark as being sent
      handleChat(true); // Mark as manual when Enter is pressed
      setTimeout(() => (isMessageBeingSent = false), 500); // Reset after 500ms
    }
  };

  // Handle Send button click
  const handleButtonClick = () => {
    if (!isMessageBeingSent) {
      isMessageBeingSent = true;
      handleChat(true); // Mark as manual when Send button is clicked
      setTimeout(() => (isMessageBeingSent = false), 500); // Reset after 500ms
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
