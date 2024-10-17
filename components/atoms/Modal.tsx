// File: components/atoms/Modal.tsx

import React, { useEffect } from 'react';
import styles from 'styles/components/atoms/Modal.module.css';
import { useModal } from 'components/state/context/ModalContext'; // Import useModal

interface ModalProps {
  modalId: string; // Unique identifier for this modal
  title: string;
  message: React.ReactNode; // Supports JSX
  confirmText: string;
  onConfirm: () => void;
}

const Modal: React.FC<ModalProps> = ({ modalId, title, message, confirmText, onConfirm }) => {
  const { activeModal, closeModal } = useModal(); // Use modal context
  const isOpen = activeModal === modalId; // Check if this modal is active

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal(); // Close modal on Escape key
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeModal]);

  if (!isOpen) return null; // Don't render if the modal is not active

  return (
    <div className={styles.modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2>{title}</h2>
        <div>{message}</div> {/* Render JSX content */}
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
