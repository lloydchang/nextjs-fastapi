// File: components/organisms/ChatInput.tsx

import React, { useState } from 'react';
import styles from 'styles/components/organisms/ChatInput.module.css';
import ControlButtons from 'components/organisms/ControlButtons';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: () => Promise<void>;
  isCamOn: boolean;
  isMicOn: boolean;
  toggleMic: () => void;
  startCam: () => void;
  stopCam: () => void;
  isPipOn: boolean;
  togglePip: () => void;
  isMemOn: boolean;
  toggleMem: () => void;
  eraseMemory: () => void;
  isFullScreenOn: boolean;
  toggleFullScreen: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  chatInput,
  setChatInput,
  handleChat,
  isCamOn,
  isMicOn,
  toggleMic,
  startCam,
  stopCam,
  isPipOn,
  togglePip,
  isMemOn,
  toggleMem,
  eraseMemory,
  isFullScreenOn,
  toggleFullScreen,
}) => {
  const [isSending, setIsSending] = useState(false);

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isSending) {
      e.preventDefault(); // Prevent default newline on Enter
      if (chatInput.trim() === '') return;
      setIsSending(true);
      try {
        await handleChat();
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleButtonClick = async () => {
    if (!isSending && chatInput.trim() !== '') {
      setIsSending(true);
      try {
        await handleChat();
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className={styles.inputContainer}>
      {/* Row with input */}
      <div className={styles.inputRow}>
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Chat here…"
          className={styles.input}
          rows={1}
          disabled={isSending}
        />
      </div>

      {/* Row with send button and control buttons */}
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={styles.sendButton}
          disabled={isSending}
        >
          Send
        </button>
        <div className={styles.controlRow}>
          <ControlButtons
            isCamOn={isCamOn}
            isMicOn={isMicOn}
            toggleMic={toggleMic}
            startCam={startCam}
            stopCam={stopCam}
            isPipOn={isPipOn}
            togglePip={togglePip}
            isMemOn={isMemOn}
            toggleMem={toggleMem}
            eraseMemory={eraseMemory}
            isFullScreenOn={isFullScreenOn}
            toggleFullScreen={toggleFullScreen}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);
