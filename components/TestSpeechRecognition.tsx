// components/TestSpeechRecognition.tsx

import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

const TestSpeechRecognition: React.FC = () => {
  const [transcript, setTranscript] = React.useState<string>('');
  const [isFinal, setIsFinal] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleResult = React.useCallback((newTranscript: string, final: boolean) => {
    console.log(`TestSpeechRecognition - Transcript: "${newTranscript}", Final: ${final}`);
    setTranscript(newTranscript);
    setIsFinal(final);
    if (final) {
      setError(null); // Clear any previous errors
    }
  }, []);

  const { startHearing, stopHearing } = useSpeechRecognition(handleResult);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        <p>
          <strong>Transcript:</strong> {transcript}
        </p>
        <p>
          <strong>Status:</strong> {isFinal ? 'Final' : 'Interim'}
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <div className={styles.buttons}>
        <button type="button" onClick={startHearing} className={styles.button}>
          Start Hearing
        </button>
        <button type="button" onClick={stopHearing} className={styles.button}>
          Stop Hearing
        </button>
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
