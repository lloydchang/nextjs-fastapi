// File: components/atoms/Modal.tsx

import React from 'react';
import styles from 'styles/components/atoms/Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.confirmButton} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
