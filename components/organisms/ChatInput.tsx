// File: components/organisms/ChatInput.tsx

import React from 'react';
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
  interimSpeech: string; // New prop for interim speech
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
  interimSpeech,
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
          disabled={isListening} // Disable input while listening
        />
      </div>

      {/* Display Interim Speech */}
      {isListening && interimSpeech && (
        <div className={styles.interimSpeech}>
          <em>{interimSpeech}</em>
        </div>
      )}

      {/* Row with send button and control buttons */}
      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={styles.sendButton}
          disabled={isListening} // Disable sending while listening
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
            hasVisibleMessages={hasVisibleMessages} // Pass the prop to ControlButtons
            isListening={isListening} // Pass isListening to ControlButtons
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);
