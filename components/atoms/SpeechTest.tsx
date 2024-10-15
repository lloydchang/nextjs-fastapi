// File: components/atoms/SpeechTest.tsx

import React, { useState, useCallback } from 'react';
import TestSpeechRecognition from 'components/organisms/TestSpeechRecognition'; // Import TestSpeechRecognition component

const SpeechTest: React.FC = () => {
  const [final, setFinal] = useState<string>(''); // Only track final results in this component
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Start in dark mode by default

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinal(text);
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
        onSpeechResult={handleFinal} // Only handle the final speech result
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
