// File: components/organisms/TestSpeechRecognition.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from 'styles/components/organisms/TestSpeechRecognition.module.css';
import useSpeechRecognition from 'components/state/hooks/useSpeechRecognition';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
  onInterimUpdate: (interimResult: string) => void; // Callback for interim results
}

// Debounce function to reduce rapid state updates
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({
  isMicOn,
  onSpeechResult,
  onInterimUpdate,
}) => {
  const [results, setResults] = useState<string>(''); // Stores the final speech recognition results
  const [interimResults, setInterimResults] = useState<string>(''); // Stores the interim (in-progress) results
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active

  // Memoized final result handler
  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setResults(text); // Update final result state
    onSpeechResult(text); // Propagate the result to the parent component
  }, [onSpeechResult]);

  // Memoized interim result handler
  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterimResults(text); // Update interim result state
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

  // Debounce the interim results to prevent frequent updates causing flickering
  const debouncedInterimResults = useDebounce(interimResults, 200);

  // Memoized final result to prevent unnecessary renders
  const finalContent = useMemo(() => results, [results]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        <p><strong>{isListening ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
        <textarea
          value={debouncedInterimResults}
          readOnly
          placeholder="Interim Speech..."
          rows={2}
        />
        <textarea
          value={finalContent}
          readOnly
          placeholder="Final Speech..."
          rows={2}
        />
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
