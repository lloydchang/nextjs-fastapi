// File: components/atoms/Modal.tsx

import React, { useEffect } from 'react';
import styles from 'styles/components/atoms/Modal.module.css';
import { useModal } from 'components/state/context/ModalContext'; // Correct import

interface ModalProps {
  modalId: string; // Unique identifier for this modal
  onConfirm: () => void;
  title: string;
  message: React.ReactNode; // Accept JSX
  confirmText: string;
}

const Modal: React.FC<ModalProps> = ({ modalId, onConfirm, title, message, confirmText }) => {
  const { activeModal, closeModal } = useModal(); // Use modal context
  const isOpen = activeModal === modalId; // Check if this modal is active

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal(); // Close modal on Escape
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeModal]);

  // Return null if the modal is not open
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2>{title}</h2>
        <div>{message}</div> {/* Render JSX */}
        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={closeModal}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
