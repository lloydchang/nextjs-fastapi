// File: components/atoms/ChatInput.tsx

import React, { useRef } from 'react';
import styles from 'styles/components/atoms/ChatInput.module.css';
import ControlButtons from 'components/organisms/ControlButtons';

interface ChatInputProps {
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChat: (isManual: boolean) => void;
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
  const isSendingRef = useRef(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isSendingRef.current) {
      if (chatInput.trim() === '') return;
      isSendingRef.current = true;
      handleChat(true);
      setChatInput('');
      isSendingRef.current = false;
    }
  };

  const handleButtonClick = () => {
    if (!isSendingRef.current && chatInput.trim() !== '') {
      isSendingRef.current = true;
      handleChat(true);
      setChatInput('');
      isSendingRef.current = false;
    }
  };

  return (
    <div className={styles.inputContainer}>
      <button type="button" onClick={handleButtonClick} className={styles.sendButton}>
        Send
      </button>
      <textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Chat here…"
        className={styles.input}
        rows={1}
      />
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
  );
};

export default React.memo(ChatInput);
