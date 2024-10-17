// File: components/organisms/ControlButtons.tsx

import React, { useCallback } from 'react';
import styles from 'styles/components/organisms/ControlButtons.module.css';
import Modal from 'components/atoms/Modal';
import { useModal } from 'components/state/context/ModalContext'; // Import useModal

interface ControlButtonsProps {
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
  hasVisibleMessages: boolean;
  isListening: boolean; // Indicates if speech recognition is active
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
  isListening,
}) => {
  const { openModal, closeModal, activeModal } = useModal(); // Use modal context
  const modalId = 'erase-chat-modal'; // Unique ID for the erase confirmation modal

  const isModalOpen = activeModal === modalId; // Check if the modal is active

  // Open the modal for erase confirmation
  const handleOpenModal = useCallback(() => {
    openModal(modalId); // Use the modal context to open
  }, [openModal, modalId]);

  // Confirm erase and close the modal
  const confirmEraseMemory = useCallback(() => {
    eraseMemory(); // Call eraseMemory function
    closeModal(); // Close the modal after erasing
  }, [eraseMemory, closeModal]);

  const micButtonText = '🎤'; // Emoji for mic button
  const eraseButtonText = '🗑️'; // Emoji for erase button
  const fullScreenButtonText = '⛶'; // Emoji for full-screen button

  return (
    <div className={styles.container}>
      {/* Microphone Button */}
      <button
        type="button"
        onClick={toggleMic}
        className={`${styles.button} ${isMicOn ? styles.stopButton : styles.startButton}`}
        aria-pressed={isMicOn}
        aria-label="Toggle Microphone"
        disabled={isListening} // Disable button while listening
      >
        {micButtonText}
      </button>

      {/* Erase Button */}
      <button
        type="button"
        onClick={handleOpenModal} // Use the context-based modal open function
        className={`${styles.button} ${styles.eraseButton}`}
        aria-label="Erase Chat"
        disabled={!hasVisibleMessages} // Disable if no messages to erase
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
        modalId={modalId} // Pass the unique modal ID
        title="Erase chat messages?"
        message={
          <>
            Are you sure?<br />
            <strong>Cannot be undone.</strong>
          </>
        }
        confirmText="Erase"
        onConfirm={confirmEraseMemory} // Call confirm function on confirm
      />
    </div>
  );
};

export default React.memo(ControlButtons);
