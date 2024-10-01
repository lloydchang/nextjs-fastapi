// components/TestSpeechRecognition.tsx

import React, { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Add a prop to control mic state
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn }) => {
  const [transcript, setTranscript] = React.useState<string>('');
  const [isFinal, setIsFinal] = React.useState<boolean>(false);
  const [isListening, setIsListening] = React.useState<boolean>(false); // Track if speech recognition is active
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

  // Automatically start/stop hearing when `isMicOn` changes
  useEffect(() => {
    console.log(`isMicOn state changed: ${isMicOn}`);
    if (isMicOn) {
      console.log('Microphone is on, starting speech recognition...');
      startHearing();
      setIsListening(true); // Update the status to indicate that it's listening
    } else {
      console.log('Microphone is off, stopping speech recognition...');
      stopHearing();
      setIsListening(false); // Update the status to indicate that it's not listening
    }
  }, [isMicOn, startHearing, stopHearing]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        {/* Show the current speech recognition status */}
        <p>
          <strong>Speech Recognition Status:</strong> {isListening ? 'Listening 🎧' : 'Not Listening 🚫'}
        </p>
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
