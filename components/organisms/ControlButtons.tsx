// File: components/organisms/ControlButtons.tsx

import React from 'react';
import styles from 'styles/components/organisms/ControlButtons.module.css';

interface ControlButtonsProps {
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

const ControlButtons: React.FC<ControlButtonsProps> = ({
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
  const confirmEraseMemory = () => {
    if (window.confirm('Are you sure you want to delete all your saved chat messages? This action cannot be undone.')) {
      eraseMemory();
    }
  };

  // Simplified micButtonText
  const micButtonText = '🎤';
  const eraseButtonText = '🗑️';
  const fullScreenButtonText = '⛶';

  return (
    <div className={styles.container}>
      {/* Microphone Button */}
      <button
        type="button"
        onClick={toggleMic}
        className={`${styles.button} ${!isMicOn ? styles.startButton : styles.stopButton}`}
        aria-pressed={isMicOn}
        aria-label={micButtonText}
      >
        {micButtonText}
      </button>

      {/* Erase Button */}
      <button
        type="button"
        onClick={confirmEraseMemory}
        className={`${styles.button} ${styles.eraseButton}`}
        aria-label={eraseButtonText}
      >
        {eraseButtonText}
      </button>

      {/* Full Screen Mode Button */}
      <button
        type="button"
        onClick={toggleFullScreen}
        className={`${styles.button} ${isFullScreenOn ? styles.stopButton : styles.startButton}`}
        aria-pressed={isFullScreenOn}
        aria-label="Full Screen Mode"
      >
        {fullScreenButtonText}
      </button>
    </div>
  );
};

export default React.memo(ControlButtons);
