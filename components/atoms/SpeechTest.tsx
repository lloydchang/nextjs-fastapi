// File: components/atoms/SpeechTest.tsx

import React, { useState, useCallback } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';

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

  const { isListening } = useSpeechRecognition({
    isMicOn: true, // Automatically turn on mic for testing
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
  });

  return (
    <div>
      <h3>Speech Test</h3>
      <p>Listening: {isListening ? 'Yes' : 'No'}</p>
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
