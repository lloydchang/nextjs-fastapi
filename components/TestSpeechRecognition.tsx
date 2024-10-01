// components/TestSpeechRecognition.tsx

import React, { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

const TestSpeechRecognition: React.FC<{ isMicOn: boolean }> = ({ isMicOn }) => {
  const [transcript, setTranscript] = React.useState<string>('');
  const [isFinal, setIsFinal] = React.useState<boolean>(false);

  const { startHearing, stopHearing } = useSpeechRecognition((newTranscript, final) => {
    setTranscript(newTranscript);
    setIsFinal(final);
  });

  // Automatically start hearing when mic is active
  useEffect(() => {
    if (isMicOn) {
      startHearing();
    } else {
      stopHearing();
    }
  }, [isMicOn, startHearing, stopHearing]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        <p>
          <strong>Transcript:</strong> {transcript}
        </p>
        <p>
          <strong>Status:</strong> {isFinal ? 'Final' : 'Interim'}
        </p>
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
