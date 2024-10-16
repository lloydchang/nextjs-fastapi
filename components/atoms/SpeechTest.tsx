// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css';

interface SpeechTestProps {
  isMicOn: boolean;
  toggleMic: () => Promise<void>; // Add toggleMic to control the microphone state
  onSpeechResult: (finalResult: string) => void;
  onInterimUpdate: (interimResult: string) => void;
  showFinalResult?: boolean; // Option to show final result textarea
  showInterimResult?: boolean; // Option to show interim result textarea
  showIsListening?: boolean; // Option to show listening status
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

  const handleFinal = useCallback(
    (text: string) => {
      console.log('Final Speech:', text);
      setFinalResult((prev) => prev + ' ' + text); // Append new final results

      // Send the result to parent (e.g., as a chat message)
      onSpeechResult(text);
    },
    [onSpeechResult]
  );

  const handleInterim = useCallback(
    (text: string) => {
      console.log('Interim Speech:', text);
      setInterimResult(text);
      onInterimUpdate(text); // Pass the interim result to the parent
    },
    [onInterimUpdate]
  );

  const { startListening, stopListening } = useSpeechRecognition({
    isMicOn,
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
    onEnd: () => {
      console.log('Clearing final result on recognition end.');
      setFinalResult(''); // Clear final result when recognition ends
      setIsListening(false); // Reset listening UI state when recognition ends
    },
  });

  useEffect(() => {
    if (isMicOn && !isListening) {
      startListening();
      setIsListening(true); // Update UI when listening starts
    } else if (!isMicOn && isListening) {
      stopListening();
      setIsListening(false); // Update UI when listening stops
    }
  }, [isMicOn, isListening, startListening, stopListening]);

  useEffect(() => {
    if (interimRef.current) {
      interimRef.current.scrollLeft = interimRef.current.scrollWidth; // Scroll to the right (end)
    }
  }, [interimResult]);

  useEffect(() => {
    if (finalRef.current) {
      finalRef.current.scrollLeft = finalRef.current.scrollWidth; // Scroll to the right (end)
    }
  }, [finalResult]);

  const toggleListening = async () => {
    if (!isMicOn) {
      console.log('Microphone is off, turning it on.');
      await toggleMic(); // Turn the mic on if it's off
    }

    if (isListening) {
      stopListening(); // Stop listening
      setIsListening(false); // Update UI to reflect stopped listening
      if (isMicOn) {
        console.log('Microphone is on, turning it off.');
        await toggleMic(); // Turn the mic off if it's on
      }
    } else {
      startListening(); // Start listening
      setIsListening(true); // Update UI to reflect started listening
    }
  };

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>

      {/* Conditionally render interim result based on showInterimResult and isListening */}
      {showInterimResult && isListening && (
        <textarea
          value={interimResult}
          readOnly
          placeholder=""
          rows={1}
          ref={interimRef}
          className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        />
      )}

      {/* Conditionally render Final Result based on showFinalResult prop */}
      {showFinalResult && (
        <textarea
          value={finalResult}
          readOnly
          placeholder=""
          rows={1}
          ref={finalRef}
          className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        />
      )}

      {/* Conditionally render the listening status */}
      {/* {showIsListening && (
        <div className={`${styles.listeningStatus} ${isListening ? styles.listening : styles.notListening}`}>
          {isListening ? 'Currently Listening...' : 'Not Listening'}
        </div>
      )} */}

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
