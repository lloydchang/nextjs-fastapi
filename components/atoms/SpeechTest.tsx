// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css';

interface SpeechTestProps {
  isMicOn: boolean;
  onSpeechResult: (finalResult: string) => void;
  onInterimUpdate: (interimResult: string) => void;
}

const SpeechTest: React.FC<SpeechTestProps> = ({ isMicOn, onSpeechResult, onInterimUpdate }) => {
  const [interimResult, setInterimResult] = useState<string>('');
  const [finalResult, setFinalResult] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinalResult((prev) => prev + ' ' + text); // Append new final results
    onSpeechResult(text); // Pass the result to the parent
  }, [onSpeechResult]);

  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterimResult(text);
    onInterimUpdate(text); // Pass the interim result to the parent
  }, [onInterimUpdate]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    isMicOn,
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
  });

  useEffect(() => {
    if (isMicOn && !isListening) {
      startListening();
    } else if (!isMicOn && isListening) {
      stopListening();
    }
  }, [isMicOn, isListening, startListening, stopListening]);

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
      
      {/* Interim Result Textarea */}
      <textarea
        value={interimResult}
        readOnly
        placeholder="Interim Result..."
        rows={1} // Keep the textarea with 1 row, but allow scrolling
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      />

      {/* Final Result Textarea */}
      <textarea
        value={finalResult}
        readOnly
        placeholder="Final Result..."
        rows={1} // Keep the textarea with 1 row, but allow scrolling
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      />
    </div>
  );
};

export default SpeechTest;
