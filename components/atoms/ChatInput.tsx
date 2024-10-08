// File: components/atoms/ChatInput.tsx

import React, { useRef } from 'react';
import styles from '../../styles/components/atoms/ChatInput.module.css';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: (isManual: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ chatInput, setChatInput, handleChat }) => {
  const isSendingRef = useRef(false); // Prevent multiple sends

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isSendingRef.current) {
      if (chatInput.trim() === '') return; // Do not send empty messages
      isSendingRef.current = true;
      handleChat(true);
      setChatInput(''); // Clear input immediately
      // Reset isSendingRef immediately
      isSendingRef.current = false;
    }
  };

  const handleButtonClick = () => {
    if (!isSendingRef.current && chatInput.trim() !== '') {
      isSendingRef.current = true;
      handleChat(true);
      setChatInput(''); // Clear input immediately
      // Reset isSendingRef immediately
      isSendingRef.current = false;
    }
  };

  return (
    <div className={styles.inputContainer}>
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder=""
        className={styles.input}
        rows={1} /* Set rows for initial size */
      />
      <button type="button" onClick={handleButtonClick} className={styles.sendButton}>
        Send
      </button>
    </div>
  );
};

export default React.memo(ChatInput);
