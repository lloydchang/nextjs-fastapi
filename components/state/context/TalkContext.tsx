// File: components/state/context/TalkContext.tsx

'use client';

import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Talk } from 'types'; // Import the shared Talk type

interface TalkContextType {
  talks: Talk[];
  setTalks: React.Dispatch<React.SetStateAction<Talk[]>>;
}

const TalkContext = createContext<TalkContextType | undefined>(undefined);

export const TalkProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  const [talks, setTalks] = useState<Talk[]>([]);

  return (
    <TalkContext.Provider value={{ talks, setTalks }}>
      {children}
    </TalkContext.Provider>
  );
});

export const useTalkContext = (): TalkContextType => {
  const context = useContext(TalkContext);
  if (!context) {
    throw new Error("useTalkContext must be used within a TalkProvider");
  }
  return context;
};
