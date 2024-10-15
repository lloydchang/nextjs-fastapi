// File: components/atoms/SpeechTest.tsx

import React, { useState, useCallback } from 'react';
import TestSpeechRecognition from 'components/organisms/TestSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css'; // Import the CSS module

const SpeechTest: React.FC = () => {
  const [final, setFinal] = useState<string>(''); // Only track final results in this component
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Start in dark mode by default

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinal(text);
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>
      <h3>Speech Test</h3>
      <button
        className={`${styles.toggleButton} ${isDarkMode ? styles.dark : styles.light}`}
        onClick={toggleDarkMode}
      >
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
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
      />
    </div>
  );
};

export default SpeechTest;
