// components/TestSpeechRecognition.tsx

import React, { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn }) => {
  const [results, setResults] = React.useState<string>('');
  const [interimResults, setInterimResults] = React.useState<string>(''); // Track interim results
  const [isListening, setIsListening] = React.useState<boolean>(false); // Track if speech recognition is active
  const [error, setError] = React.useState<string | null>(null);

  const handleResult = React.useCallback((newResults: string, final: boolean) => {
    console.log(`TestSpeechRecognition - Results: "${newResults}", Final: ${final}`);
    if (final) {
      setResults(newResults); // Set final results
      setInterimResults(''); // Clear interim when final is set
      setError(null); // Clear any previous errors
    } else {
      setInterimResults(newResults); // Update interim results
    }
  }, []);

  const { startHearing, stopHearing } = useSpeechRecognition(handleResult);

  // Automatically start/stop hearing when `isMicOn` changes
  useEffect(() => {
    console.log(`isMicOn state changed: ${isMicOn}`);
    if (isMicOn) {
      console.log('Microphone is on, starting listening...');
      startHearing();
      setIsListening(true); // Update the status to indicate that it's listening
    } else {
      console.log('Microphone is off, stopping listening...');
      stopHearing();
      setIsListening(false); // Update the status to indicate that it's not listening
    }
  }, [isMicOn, startHearing, stopHearing]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        {/* Show the current speech recognition status */}
        <p>
          <strong>{isListening ? 'Listening 👂' : 'Not Listening 🙉'}</strong>
        </p>
        <p>
          <strong>Final Results:</strong> {results}
        </p>
        <p>
          <strong>Interim Results:</strong> {interimResults}
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
