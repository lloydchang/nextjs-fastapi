// components/TestSpeechRecognition.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
  onInterimUpdate: (interimResult: string) => void; // Callback for interim results (real-time to chatbots)
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult, onInterimUpdate }) => {
  const [results, setResults] = useState<string>(''); // Stores the final speech recognition results
  const [interimResults, setInterimResults] = useState<string>(''); // Stores the interim (in-progress) results
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active
  const prevInterimResult = useRef<string>(''); // Stores the previous interim result to detect duplicates
  const sentInterimSet = useRef<Set<string>>(new Set()); // Tracks sent interim sentences to prevent duplication

  // Helper function to split results into logical chunks
  const getUniqueInterimChunks = (text: string) => {
    const chunks = text.trim().split(/\s+/).filter(chunk => chunk.length > 0);
    return chunks.filter(chunk => !sentInterimSet.current.has(chunk));
  };

  const handleResult = useCallback((newResults: string, final: boolean) => {
    const uniqueChunks = getUniqueInterimChunks(newResults);
    const newInterimResult = uniqueChunks.join(' ');

    if (newInterimResult && newInterimResult !== prevInterimResult.current) {
      onInterimUpdate(newInterimResult); // Send interim updates to chatbots
      prevInterimResult.current = newInterimResult;
      uniqueChunks.forEach(chunk => sentInterimSet.current.add(chunk));
    }

    if (final) {
      setResults(prev => `${prev} ${newResults}`.trim());
      setInterimResults('');
      sentInterimSet.current.clear();
      onSpeechResult(newResults.trim());
      prevInterimResult.current = '';
    } else {
      setInterimResults(newResults);
    }
  }, [onInterimUpdate, onSpeechResult]);

  const { startHearing, stopHearing } = useSpeechRecognition(handleResult);

  useEffect(() => {
    if (isMicOn) {
      startHearing();
      setIsListening(true);
    } else {
      stopHearing();
      setIsListening(false);
      sentInterimSet.current.clear();
      prevInterimResult.current = '';
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
