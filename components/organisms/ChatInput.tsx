// File: components/organisms/ChatInput.tsx

import React, { useEffect } from 'react';
import styles from 'styles/components/organisms/ChatInput.module.css';
import ControlButtons from 'components/organisms/ControlButtons';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: () => void;
  isCamOn: boolean;
  isMicOn: boolean;
  toggleMic: () => Promise<void>;
  startCam: () => Promise<void>;
  stopCam: () => void;
  isPipOn: boolean;
  togglePip: () => Promise<void>;
  isMemOn: boolean;
  toggleMem: () => void;
  eraseMemory: () => void;
  isFullScreenOn: boolean;
  toggleFullScreen: () => void;
  hasVisibleMessages: boolean; // New prop to track if there are visible messages
  isListening: boolean; // New prop for listening state
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
  hasVisibleMessages,
  isListening,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline on Enter
      if (chatInput.trim() !== '') {
        handleChat();
      }
    }
  };

  const handleButtonClick = () => {
    if (chatInput.trim() !== '') {
      handleChat();
    }
  };

  // Optional: Automatically send message when speech recognition finalizes
  useEffect(() => {
    if (chatInput.trim() && !isListening) {
      handleChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatInput, isListening]);

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
        />
      </div>

      {/* Row with send button and control buttons */}
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={styles.sendButton}
          disabled={!chatInput.trim()}
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
            hasVisibleMessages={hasVisibleMessages}
            isListening={isListening} // Pass isListening to ControlButtons
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);
