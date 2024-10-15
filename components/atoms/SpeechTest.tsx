// File: components/atoms/SpeechTest.tsx

import React, { useState, useCallback } from 'react';
import TestSpeechRecognition from 'components/organisms/TestSpeechRecognition'; // Import TestSpeechRecognition component

const SpeechTest: React.FC = () => {
  const [interim, setInterim] = useState<string>('');
  const [final, setFinal] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Track dark mode state

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinal(text);
  }, []);

  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterim(text);
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div
      style={{
        backgroundColor: isDarkMode ? 'black' : 'white',
        color: isDarkMode ? 'white' : 'black',
        padding: '20px',
      }}
    >
      <h3>Speech Test</h3>
      <button onClick={toggleDarkMode}>
        Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
      </button>
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
        style={{
          backgroundColor: isDarkMode ? 'grey' : 'lightgrey',
          color: isDarkMode ? 'white' : 'black',
        }}
      />
      <textarea
        value={final}
        readOnly
        placeholder="Final Speech..."
        rows={2}
        style={{
          backgroundColor: isDarkMode ? 'grey' : 'lightgrey',
          color: isDarkMode ? 'white' : 'black',
        }}
      />
    </div>
  );
};

export default SpeechTest;
