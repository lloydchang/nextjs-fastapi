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
  isMicOn = true, // Ensure the mic is always on by default
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
  const hasStarted = useRef<boolean>(false); // Prevent multiple starts

  const handleFinal = useCallback(
    (text: string) => {
      console.log('Final Speech:', text);
      setFinalResult((prev) => prev + ' ' + text);
      onSpeechResult(text);
    },
    [onSpeechResult]
  );

  const handleInterim = useCallback(
    (text: string) => {
      console.log('Interim Speech:', text);
      setInterimResult(text);
      onInterimUpdate(text);
    },
    [onInterimUpdate]
  );

  const { startListening, stopListening, initializeRecognition, error } = useSpeechRecognition({
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
    onEnd: () => {
      console.log('Recognition ended, resetting state.');
      setFinalResult(''); // Clear final result on end
      setIsListening(false); // Update UI state
    },
  });

  // Force microphone and listening to start immediately on mount
  useEffect(() => {
    const initializeMicAndStartListening = async () => {
      console.log('Requesting microphone permissions and starting listening.');
      await toggleMic(); // Ensure the microphone is on

      initializeRecognition(); // Initialize recognition instance
      startListening(); // Start listening immediately
      setIsListening(true); // Update state
      hasStarted.current = true; // Prevent multiple starts
    };

    if (!hasStarted.current) {
      initializeMicAndStartListening();
    }
  }, [initializeRecognition, startListening, toggleMic]);

  useEffect(() => {
    if (interimRef.current) {
      interimRef.current.scrollLeft = interimRef.current.scrollWidth;
    }
  }, [interimResult]);

  useEffect(() => {
    if (finalRef.current) {
      finalRef.current.scrollLeft = finalRef.current.scrollWidth;
    }
  }, [finalResult]);

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      console.log('Stopped listening.');
    } else {
      await toggleMic(); // Turn on the mic if not already on
      startListening();
      setIsListening(true);
      console.log('Started listening.');
    }
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
