// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  isMicOn = true, // Ensure mic is always on by default
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
  const [isListening, setIsListening] = useState<boolean>(true); // Start listening by default

  const interimRef = useRef<HTMLTextAreaElement>(null);
  const finalRef = useRef<HTMLTextAreaElement>(null);

  const { startListening, stopListening, isListening: recognitionActive, error } =
    useSpeechRecognition({
      onSpeechResult: (text) => setFinalResult((prev) => prev + ' ' + text),
      onInterimUpdate: (text) => setInterimResult(text),
      onEnd: () => setIsListening(false),
    });

  // Start listening when the component mounts if `isMicOn` is true
  useEffect(() => {
    if (isMicOn && !recognitionActive) {
      startListening();
    }
  }, [isMicOn, recognitionActive, startListening]);

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
      console.log('Stopped listening.');
    } else {
      await toggleMic(); // Turn on the mic if not already on
      startListening();
      console.log('Started listening.');
    }
    setIsListening(!isListening);
  };

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>
      {showInterimResult && isListening && (
        <textarea
          value={interimResult}
          readOnly
          rows={1}
          ref={interimRef}
          className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        />
      )}
      {showFinalResult && (
        <textarea
          value={finalResult}
          readOnly
          rows={1}
          ref={finalRef}
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
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default SpeechTest;
