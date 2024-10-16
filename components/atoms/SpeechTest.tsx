// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css';

interface SpeechTestProps {
  isMicOn: boolean;
  toggleMic: () => Promise<void>; // Add toggleMic to control the microphone state
  onSpeechResult: (finalResult: string) => void;
  onInterimUpdate: (interimResult: string) => void;
}

const SpeechTest: React.FC<SpeechTestProps> = ({ isMicOn, toggleMic, onSpeechResult, onInterimUpdate }) => {
  const [interimResult, setInterimResult] = useState<string>('');
  const [finalResult, setFinalResult] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false); // New state to manage listening UI

  const interimRef = useRef<HTMLTextAreaElement>(null); // Ref to track interim textarea
  const finalRef = useRef<HTMLTextAreaElement>(null); // Ref to track final textarea

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setFinalResult((prev) => prev + ' ' + text); // Append new final results

    // Send the result to parent (e.g., as a chat message)
    onSpeechResult(text);

    // Clear final result after it is sent
    setTimeout(() => {
      setFinalResult(''); // Ensure the final result is cleared after it’s displayed
    }, 1000); // You can adjust the delay if needed for smoother UI
  }, [onSpeechResult]);

  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterimResult(text);
    onInterimUpdate(text); // Pass the interim result to the parent
  }, [onInterimUpdate]);

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
