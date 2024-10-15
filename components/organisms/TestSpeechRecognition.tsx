// File: components/organisms/TestSpeechRecognition.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from 'styles/components/organisms/TestSpeechRecognition.module.css';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
  onInterimUpdate: (interimResult: string) => void; // Callback for interim results
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({
  isMicOn,
  onSpeechResult,
  onInterimUpdate,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active
  const interimRef = useRef<string>(''); // Stores interim results using useRef to avoid re-rendering
  const finalRef = useRef<string>(''); // Stores final results using useRef to avoid re-rendering

  // Memoized final result handler
  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    finalRef.current = text; // Store final result in ref
    onSpeechResult(text); // Propagate the result to the parent component
  }, [onSpeechResult]);

  // Memoized interim result handler
  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    interimRef.current = text; // Store interim result in ref
    onInterimUpdate(text); // Propagate interim update to the parent component
  }, [onInterimUpdate]);

  // Use the custom hook for speech recognition
  const { isListening: speechRecognitionListening } = useSpeechRecognition({
    isMicOn,
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
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        <p><strong>{isListening ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
        <textarea
          value={interimRef.current}
          readOnly
          placeholder="Interim Speech..."
          rows={2}
        />
        <textarea
          value={finalRef.current}
          readOnly
          placeholder="Final Speech..."
          rows={2}
        />
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
