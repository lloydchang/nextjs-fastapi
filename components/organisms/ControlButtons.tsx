// File: components/organisms/ControlButtons.tsx

import React, { useState } from 'react';
import styles from 'styles/components/organisms/ControlButtons.module.css';
import Modal from 'components/atoms/Modal';

interface ControlButtonsProps {
  isCamOn: boolean;
  isMicOn: boolean;
  toggleMic: () => Promise<void>; // Updated to return Promise<void>
  startCam: () => Promise<void>;
  stopCam: () => void;
  isPipOn: boolean;
  togglePip: () => Promise<void>;
  isMemOn: boolean;
  toggleMem: () => void;
  eraseMemory: () => void;
  isFullScreenOn: boolean;
  toggleFullScreen: () => void;
  hasVisibleMessages: boolean;
  isListening: boolean; // New prop for listening state
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
  hasVisibleMessages,
  isListening, // New prop
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const confirmEraseMemory = () => {
    eraseMemory();
    closeModal();
  };

  // Mic button text with listening indicator
  const micButtonText = isListening ? '🎤 Listening...' : '🎤';
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
        aria-label="Toggle Microphone"
      >
        {micButtonText}
      </button>

      {/* Erase Button */}
      <button
        type="button"
        onClick={openModal}
        className={`${styles.button} ${styles.eraseButton}`}
        aria-label="Erase Chat"
        disabled={!hasVisibleMessages}
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

      {/* Modal for Erase Confirmation */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={confirmEraseMemory}
        title="Erase chat messages?"
        message={
          <>
            Are you sure?<br />
            <strong>Cannot be undone.</strong>
          </>
        }
        confirmText="Erase"
      />
    </div>
  );
};

export default React.memo(ControlButtons);
