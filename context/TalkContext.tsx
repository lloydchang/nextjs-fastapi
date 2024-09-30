// context/TalkContext.tsx

'use client'; // Mark this file as a Client Component

import React, { createContext, useState, ReactNode, useContext, useMemo } from 'react';

interface Talk {
  title: string;
  description: string;
  presenter: string;
  sdg_tags: string[];
  similarity_score: number;
  url: string;
}

interface TalkContextType {
  talks: Talk[];
  setTalks: React.Dispatch<React.SetStateAction<Talk[]>>;
}

const TalkContext = createContext<TalkContextType | undefined>(undefined);

export const TalkProvider = ({ children }: { children: ReactNode }) => {
  const [talks, setTalks] = useState<Talk[]>([]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ talks, setTalks }), [talks, setTalks]);

  return (
    <TalkContext.Provider value={value}>
      {children}
    </TalkContext.Provider>
  );
};

export const useTalkContext = () => {
  const context = useContext(TalkContext);
  if (!context) {
    throw new Error("useTalkContext must be used within a TalkProvider");
  }
  return context;
};
