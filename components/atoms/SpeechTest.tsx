// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css';

const SpeechTest: React.FC = () => {
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinalTranscript(prev => prev + ' ' + text);
  }, []);

  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterimTranscript(text);
  }, []);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    isMicOn: true,
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
  });

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>
      <button onClick={toggleListening} className={styles.toggleButton}>
        {isListening ? 'Stop Listening 🙉' : 'Start Listening 👂'}
      </button>
      <textarea
        value={interimTranscript}
        readOnly
        placeholder="Interim Speech..."
        rows={3}
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
      />
      <textarea
        value={finalTranscript}
        readOnly
        placeholder="Final Speech..."
        rows={5}
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
      />
      <button onClick={() => setIsDarkMode(!isDarkMode)} className={styles.modeToggle}>
        Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
};

export default SpeechTest;
