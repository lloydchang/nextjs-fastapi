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
  const interimRef = useRef<string>(''); // Use ref to store interim results without causing re-renders
  const finalRef = useRef<string>(''); // Use ref to store final results without causing re-renders
  const [forceUpdate, setForceUpdate] = useState(0); // State to trigger a forced re-render when needed

  // Memoized final result handler
  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    finalRef.current = text; // Update final result ref
    onSpeechResult(text); // Propagate the result to the parent component
    setForceUpdate((prev) => prev + 1); // Trigger a re-render to display final results
  }, [onSpeechResult]);

  // Memoized interim result handler
  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    interimRef.current = text; // Update interim result ref
    onInterimUpdate(text); // Propagate interim update to the parent component
    setForceUpdate((prev) => prev + 1); // Trigger a re-render to display interim results
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
          value={interimRef.current} // Use ref value directly to avoid re-renders
          readOnly
          placeholder="Interim Speech..."
          rows={2}
        />
        <textarea
          value={finalRef.current} // Use ref value directly to avoid re-renders
          readOnly
          placeholder="Final Speech..."
          rows={2}
        />
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
