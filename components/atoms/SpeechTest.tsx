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
  const [isListening, setIsListening] = useState<boolean>(false);

  const interimRef = useRef<HTMLTextAreaElement>(null);
  const finalRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = useRef<boolean>(false); // Guard to prevent multiple starts

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

  const { startListening, stopListening } = useSpeechRecognition({
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
    onEnd: () => {
      console.log('Recognition ended, resetting state.');
      setFinalResult(''); // Clear final result on end
      setIsListening(false); // Update UI state
    },
  });

  // Start listening by default if `isMicOn` is true on mount
  useEffect(() => {
    if (isMicOn && !hasStarted.current) {
      console.log('Starting listening by default on load.');
      startListening();
      setIsListening(true);
      hasStarted.current = true; // Prevent multiple starts
    }
  }, [isMicOn, startListening]);

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
    if (!isMicOn) {
      console.log('Microphone is off, turning it on.');
      await toggleMic();
    }

    if (isListening) {
      stopListening();
      setIsListening(false);
      if (isMicOn) {
        console.log('Turning off microphone.');
        await toggleMic();
      }
    } else {
      startListening();
      setIsListening(true);
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
    </div>
  );
};

export default SpeechTest;
