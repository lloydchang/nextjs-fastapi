// File: components/state/context/ModalContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  activeModal: string | null; // Tracks which modal is active
  openModal: (id: string) => void; // Open modal by ID
  closeModal: () => void; // Close active modal
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null); // State to track active modal

  const openModal = (id: string) => {
    console.debug(`Opening modal: ${id}`);
    setActiveModal(id); // Set the active modal ID
  };

  const closeModal = () => {
    console.debug('Closing modal');
    setActiveModal(null); // Reset active modal
  };

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
