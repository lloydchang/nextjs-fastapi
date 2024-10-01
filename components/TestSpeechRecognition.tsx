// components/TestSpeechRecognition.tsx

import React, { useEffect, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
  onInterimUpdate: (interimResult: string) => void; // Callback for interim results (real-time to chatbots)
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({
  isMicOn,
  onSpeechResult,
  onInterimUpdate,
}) => {
  const [results, setResults] = useState<string>(''); // Stores the final speech recognition results
  const [interimResults, setInterimResults] = useState<string>(''); // Stores the interim (in-progress) results
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active

  const handleResult = (newResults: string, final: boolean) => {
    if (final) {
      setResults(newResults); // Set final results
      onSpeechResult(newResults); // Send final results to parent
      setInterimResults(''); // Clear interim results
    } else {
      setInterimResults(newResults); // Store interim results for display
      onInterimUpdate(newResults); // Send interim results to parent
    }
  };

  const { startListening, stopListening } = useSpeechRecognition(handleResult, onInterimUpdate);

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
