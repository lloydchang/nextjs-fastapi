// components/TestSpeechRecognition.tsx

import React, { useEffect, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({
  isMicOn,
  onSpeechResult,
}) => {
  const [results, setResults] = useState<string>(''); // Stores final results
  const [interimResults, setInterimResults] = useState<string>(''); // Stores interim results
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active

  const handleResult = (newResults: string, final: boolean) => {
    if (final) {
      setResults(newResults); // Replace final results instead of appending
      setInterimResults(''); // Clear interim results when final is received
      onSpeechResult(newResults.trim()); // Send final result to parent
    } else {
      setInterimResults(prev => `${prev} ${newResults}`.trim()); // Update interim results for display
    }
  };

  const { startListening, stopListening } = useSpeechRecognition(handleResult, setInterimResults);

  useEffect(() => {
    if (isMicOn) {
      startListening();
      setIsListening(true);
    } else {
      stopListening();
      setIsListening(false);
    }
  }, [isMicOn, startListening, stopListening]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        <p><strong>{isListening ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
        <p><strong>Final Results:</strong> {results}</p>
        <p><strong>Interim Results:</strong> {interimResults}</p>
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
