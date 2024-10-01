// components/TestSpeechRecognition.tsx

import React, { useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (transcript: string, isFinal: boolean) => void;
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult }) => {
  const [finalResults, setFinalResults] = React.useState<string>(''); // Store the final recognized results
  const [interimResults, setInterimResults] = React.useState<string>(''); // Store interim results
  const [isListening, setIsListening] = React.useState<boolean>(false); // Track the microphone state
  const [error, setError] = React.useState<string | null>(null);

  // Track the last processed segment to filter duplicates
  const lastRecognizedSegmentRef = useRef<string>(''); // Store the last processed segment

  // Handle incoming speech results
  const handleResult = React.useCallback(
    (newResults: string, isFinal: boolean) => {
      console.log(`Speech Recognition - Received: "${newResults}", Final: ${isFinal}`);

      // Avoid processing duplicate segments
      if (newResults === lastRecognizedSegmentRef.current) {
        console.log('Duplicate detected, skipping...');
        return; // Skip processing if it's a duplicate
      }

      // Update the reference to track the latest recognized segment
      lastRecognizedSegmentRef.current = newResults;

      if (isFinal) {
        // Concatenate the new final result and send to the chatbot
        const updatedFinalResults = (finalResults ? `${finalResults} ${newResults}` : newResults).trim();

        // Send the final result to the parent component (e.g., chatbot)
        onSpeechResult(updatedFinalResults, true);

        // Clear the final results after sending to the chatbot
        setFinalResults(''); // Clear final results to start fresh for the next input
        setError(null); // Clear errors, if any
      } else {
        // For interim results, keep updating them in real-time for display
        setInterimResults(newResults);
      }
    },
    [finalResults, onSpeechResult]
  );

  const { startHearing, stopHearing } = useSpeechRecognition(handleResult);

  // Automatically start/stop hearing when `isMicOn` changes
  useEffect(() => {
    if (isMicOn) {
      startHearing();
      setIsListening(true); // Indicate that listening is active
    } else {
      stopHearing();
      setIsListening(false); // Indicate that listening is inactive
    }
  }, [isMicOn, startHearing, stopHearing]);

  return (
    <div className={styles.container}>
      <div className={styles.transcriptContainer}>
        {/* Show the current speech recognition status */}
        <p className={styles.statusText}>
          {isListening ? 'Listening 👂' : 'Not Listening 🙉'}
        </p>

        {/* Display the combined transcription with separate styles for final and interim */}
        <p>
          <strong>Transcription:</strong>{' '}
          <span className={styles.finalText}>{finalResults}</span>{' '}
          <span className={styles.interimText}>{interimResults}</span>
        </p>

        {/* Display any errors if present */}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default React.memo(TestSpeechRecognition);
