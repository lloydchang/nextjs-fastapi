// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  const interimRef = useRef<HTMLTextAreaElement>(null); // Ref to track interim textarea
  const finalRef = useRef<HTMLTextAreaElement>(null); // Ref to track final textarea

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

  // Effect to scroll the interim textarea to the end when content updates
  useEffect(() => {
    if (interimRef.current) {
      interimRef.current.scrollLeft = interimRef.current.scrollWidth; // Scroll to the right (end)
    }
  }, [interimResult]);

  // Effect to scroll the final textarea to the end when content updates
  useEffect(() => {
    if (finalRef.current) {
      finalRef.current.scrollLeft = finalRef.current.scrollWidth; // Scroll to the right (end)
    }
  }, [finalResult]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`${styles.speechTest} ${isDarkMode ? styles.dark : styles.light}`}>
      {/* Start/Stop Button with dynamic background color */}
      <button
        onClick={toggleListening}
        className={`${styles.toggleButton} ${isListening ? styles.stopButton : styles.startButton}`}
      >
        {isListening ? 'Stop Listening 🙉' : 'Start Listening 👂'}
      </button>
      
      {/* Interim Result Textarea */}
      <textarea
        value={interimResult}
        readOnly
        placeholder="Interim Result..."
        rows={1} // Keep the textarea with 1 row, but allow scrolling
        ref={interimRef} // Attach ref to track scroll position
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      />

      {/* Final Result Textarea */}
      <textarea
        value={finalResult}
        readOnly
        placeholder="Final Result..."
        rows={1} // Keep the textarea with 1 row, but allow scrolling
        ref={finalRef} // Attach ref to track scroll position
        className={`${styles.textarea} ${isDarkMode ? styles.dark : styles.light}`}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      />
    </div>
  );
};

export default SpeechTest;
