// context/TalkContext.tsx

'use client'; // Mark this file as a Client Component

import React, { createContext, useState, ReactNode, useContext } from 'react';

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
  transcript: string | null; // Add a transcript state
  setTranscript: React.Dispatch<React.SetStateAction<string | null>>; // Add a setter for the transcript
}

const TalkContext = createContext<TalkContextType | undefined>(undefined);

export const TalkProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [transcript, setTranscript] = useState<string | null>(null); // State for transcript

  return (
    <TalkContext.Provider value={{ talks, setTalks, transcript, setTranscript }}>
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
