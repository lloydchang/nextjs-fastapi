// components/TestSpeechRecognition.tsx

import React, { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult }) => {
  const [results, setResults] = React.useState<string>('');
  const [interimResults, setInterimResults] = React.useState<string>(''); // Track interim results
  const [isListening, setIsListening] = React.useState<boolean>(false); // Track if speech recognition is active

  const handleResult = React.useCallback((newResults: string, final: boolean) => {
    if (final) {
      setResults(newResults);
      setInterimResults('');
      onSpeechResult(newResults); // Send final results to parent via prop
    } else {
      setInterimResults(newResults);
    }
  }, [onSpeechResult]);

  const { startHearing, stopHearing } = useSpeechRecognition(handleResult);

  useEffect(() => {
    if (isMicOn) {
      startHearing();
      setIsListening(true);
    } else {
      stopHearing();
      setIsListening(false);
    }
  }, [isMicOn, startHearing, stopHearing]);

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
