// File: components/state/context/TalkContext.tsx

'use client';

import React, {
  createContext,
  useState,
  useCallback, // Use useCallback for functions to prevent unnecessary re-renders
  ReactNode,
  useContext,
  useEffect, // Use useEffect for lifecycle management
} from 'react';
import { Talk } from 'types'; // Import the shared Talk type

// Define the TalkContextType interface
interface TalkContextType {
  talks: Talk[];
  setTalks: React.Dispatch<React.SetStateAction<Talk[]>>;
}

// Create the TalkContext with an undefined initial value
const TalkContext = createContext<TalkContextType | undefined>(undefined);

// TalkProvider component wrapped with React.memo for performance optimization
export const TalkProvider: React.FC<{ children: ReactNode }> = React.memo(({ children }) => {
  const [talks, setTalks] = useState<Talk[]>([]); // State to manage the list of talks

  // Memoized version of setTalks to prevent unnecessary renders of consumers
  const memoizedSetTalks = useCallback(setTalks, []);

  // Cleanup effect in case external resources or local storage are tied to the state
  useEffect(() => {
    console.log('TalkProvider - Component mounted.');

    return () => {
      console.log('TalkProvider - Component unmounted, cleaning up.');
      // Perform any cleanup tasks here if needed (e.g., clear local storage)
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount/unmount

  return (
    <TalkContext.Provider value={{ talks, setTalks: memoizedSetTalks }}>
      {children}
    </TalkContext.Provider>
  );
});

// Custom hook to access the TalkContext with error handling
export const useTalkContext = (): TalkContextType => {
  const context = useContext(TalkContext);
  if (!context) {
    throw new Error("useTalkContext must be used within a TalkProvider");
  }
  return context;
};
