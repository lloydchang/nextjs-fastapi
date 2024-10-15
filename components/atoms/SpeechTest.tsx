// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css'; // Import the CSS module

const SpeechTest: React.FC = () => {
  const [interimTranscript, setInterimTranscript] = useState<string>(''); // Track interim results in state
  const [finalTranscript, setFinalTranscript] = useState<string>(''); // Track final results in state
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Start in dark mode by default

  // Memoized final result handler
  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinalTranscript(text); // Update final result in state
  }, []);

  // Memoized interim result handler
  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterimTranscript(text); // Update interim result in state
  }, []);

  // Use the custom hook for speech recognition
  const { isListening: speechRecognitionListening } = useSpeechRecognition({
    isMicOn: true, // Automatically turn on mic for testing
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
  });

  // Only update the `isListening` state when the value changes
  useEffect(() => {
    if (isListening !== speechRecognitionListening) {
      setIsListening(speechRecognitionListening);
    }
  }, [speechRecognitionListening, isListening]);

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>
      <p><strong>{isListening ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
      <textarea
        value={interimTranscript} // Display interim transcript
        readOnly
        placeholder="Interim Speech..."
        rows={1}
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
      />
      <textarea
        value={finalTranscript} // Display final transcript
        readOnly
        placeholder="Final Speech..."
        rows={1}
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
      />
    </div>
  );
};

export default SpeechTest;
