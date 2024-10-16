// File: components/atoms/SpeechTest.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';
import styles from 'styles/components/atoms/SpeechTest.module.css';

interface SpeechTestProps {
  isMicOn: boolean;
  toggleMic: () => Promise<void>; // Added toggleMic to manage the microphone
  onSpeechResult: (finalResult: string) => void;
  onInterimUpdate: (interimResult: string) => void;
}

const SpeechTest: React.FC<SpeechTestProps> = ({ isMicOn, toggleMic, onSpeechResult, onInterimUpdate }) => {
  const [interimResult, setInterimResult] = useState<string>('');
  const [finalResult, setFinalResult] = useState<string>('');
  const interimRef = useRef<HTMLTextAreaElement>(null); // Ref to track interim textarea
  const finalRef = useRef<HTMLTextAreaElement>(null); // Ref to track final textarea

  const handleFinal = useCallback((text: string) => {
    setFinalResult((prev) => prev + ' ' + text);
    onSpeechResult(text); // Pass the result to the parent
  }, [onSpeechResult]);

  const handleInterim = useCallback((text: string) => {
    setInterimResult(text);
    onInterimUpdate(text); // Pass the interim result to the parent
  }, [onInterimUpdate]);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    isMicOn,
    toggleMic, // Pass toggleMic to manage mic state
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
  });

  const toggleListening = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

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

  return (
    <div className={`${styles.speechTest}`}>
      <button onClick={toggleListening} className={styles.toggleButton}>
        {isListening ? 'Stop Listening 🙉' : 'Start Listening 👂'}
      </button>

      {/* Interim Result Textarea */}
      <textarea
        value={interimResult}
        readOnly
        placeholder="Interim Result..."
        rows={1}
        ref={interimRef}
        className={styles.textarea}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      />

      {/* Final Result Textarea */}
      <textarea
        value={finalResult}
        readOnly
        placeholder="Final Result..."
        rows={1}
        ref={finalRef}
        className={styles.textarea}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      />
    </div>
  );
};

export default SpeechTest;
