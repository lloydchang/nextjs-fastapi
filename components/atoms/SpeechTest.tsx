// File: components/atoms/SpeechTest.tsx

import React, { useState, useCallback } from 'react';
import TestSpeechRecognition from 'components/TestSpeechRecognition'; // Import TestSpeechRecognition component

const SpeechTest: React.FC = () => {
  const [interim, setInterim] = useState<string>('');
  const [final, setFinal] = useState<string>('');

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinal(text);
  }, []);

  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterim(text);
  }, []);

  return (
    <div>
      <h3>Speech Test</h3>
      <TestSpeechRecognition
        isMicOn={true} // Automatically turn on mic for testing
        onSpeechResult={handleFinal}
        onInterimUpdate={handleInterim}
      />
      <textarea
        value={interim}
        readOnly
        placeholder="Interim Speech..."
        rows={2}
      />
      <textarea
        value={final}
        readOnly
        placeholder="Final Speech..."
        rows={2}
      />
    </div>
  );
};

export default SpeechTest;
