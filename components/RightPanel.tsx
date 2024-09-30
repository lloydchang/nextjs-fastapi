// components/RightPanel.tsx

'use client'; // Mark as a client component

// components/TestSpeechRecognition.tsx
import React, { useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const TestSpeechRecognition: React.FC = () => {
  const handleResult = useCallback((transcript: string, isFinal: boolean) => {
    console.log(`Test Speech Result: "${transcript}", isFinal: ${isFinal}`);
  }, []);

  const { startHearing, stopHearing } = useSpeechRecognition(handleResult);

  return (
    <div>
      <button onClick={startHearing}>Start Hearing</button>
      <button onClick={stopHearing}>Stop Hearing</button>
    </div>
  );
};

export default TestSpeechRecognition;
