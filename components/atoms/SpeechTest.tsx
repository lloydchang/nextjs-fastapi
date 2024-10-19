// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css';

interface SpeechTestProps {
  isMicOn: boolean;
  toggleMic: () => Promise<void>;
  onSpeechResult: (finalResult: string) => void;
  onInterimUpdate: (interimResult: string) => void;
  showFinalResult?: boolean;
  showInterimResult?: boolean;
  showIsListening?: boolean;
}

const SpeechTest: React.FC<SpeechTestProps> = ({
  isMicOn,
  toggleMic,
  onSpeechResult,
  onInterimUpdate,
  showFinalResult = true,
  showInterimResult = true,
  showIsListening = true,
}) => {
  const [interimResult, setInterimResult] = useState<string>('');
  const [finalResult, setFinalResult] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false); // Use state only

  const { startListening, stopListening, isRecognitionActive } = useSpeechRecognition({
    onSpeechResult: (text) => {
      console.log('Final Speech:', text);
      setFinalResult((prev) => prev + ' ' + text);
      onSpeechResult(text);
    },
    onInterimUpdate: (text) => {
      console.log('Interim Speech:', text);
      setInterimResult(text);
      onInterimUpdate(text);
    },
    onEnd: () => {
      console.log('Recognition ended.');
      setFinalResult(''); // Clear the final result on recognition end
      setIsListening(false); // Reflect the stopped listening state in the UI
    },
  });

  // Use effect to start listening by default only once if `isMicOn` is true
  useEffect(() => {
    if (isMicOn && !isListening) {
      console.log('Starting listening by default.');
      startListening();
      setIsListening(true); // Update listening state
    }
  }, [isMicOn, isListening, startListening]); // Ensure effect runs only when necessary

  const toggleListening = async () => {
    if (!isMicOn) {
      console.log('Turning on microphone.');
      await toggleMic();
    }

    if (isListening) {
      stopListening();
      setIsListening(false); // Stop listening
    } else {
      startListening();
      setIsListening(true); // Start listening
    }
  };

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>
      {showInterimResult && isListening && (
        <textarea
          value={interimResult}
          readOnly
          rows={1}
          className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        />
      )}
      {showFinalResult && (
        <textarea
          value={finalResult}
          readOnly
          rows={1}
          className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        />
      )}
      {showIsListening && (
        <button
          onClick={toggleListening}
          className={`${styles.toggleButton} ${isListening ? styles.stopButton : styles.startButton}`}
        >
          {isListening ? 'Stop Listening 🙉' : 'Listen 👂'}
        </button>
      )}
    </div>
  );
};

export default SpeechTest;
