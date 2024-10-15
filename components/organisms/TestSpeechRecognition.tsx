// File: components/organisms/TestSpeechRecognition.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [results, setResults] = useState<string>(''); // Stores the final speech recognition results
  const [interimResults, setInterimResults] = useState<string>(''); // Stores the interim (in-progress) results
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active

  const handleFinal = useCallback((text: string) => {
    console.log('Final Speech:', text);
    setResults(text);
    onSpeechResult(text);
  }, [onSpeechResult]);

  const handleInterim = useCallback((text: string) => {
    console.log('Interim Speech:', text);
    setInterimResults(text);
    onInterimUpdate(text);
  }, [onInterimUpdate]);

  const { isListening: speechRecognitionListening } = useSpeechRecognition({
    isMicOn,
    onSpeechResult: handleFinal,
    onInterimUpdate: handleInterim,
  });

  useEffect(() => {
    setIsListening(speechRecognitionListening);
  }, [speechRecognitionListening]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        <p><strong>{isListening ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
        <textarea
          value={interimResults}
          readOnly
          placeholder="Interim Speech..."
          rows={2}
        />
        <textarea
          value={results}
          readOnly
          placeholder="Final Speech..."
          rows={2}
        />
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
