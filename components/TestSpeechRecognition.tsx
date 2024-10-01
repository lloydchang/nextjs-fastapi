// components/TestSpeechRecognition.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
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

    // Send interim updates if unique
    if (newInterimResult && newInterimResult !== prevInterimResult.current) {
      onInterimUpdate(newInterimResult); // Send interim updates to chatbots
      prevInterimResult.current = newInterimResult;
      uniqueChunks.forEach(chunk => sentInterimSet.current.add(chunk));
    }

    if (final) {
      setResults(prev => `${prev} ${newResults}`.trim());
      setInterimResults('');
      sentInterimSet.current.clear(); // Clear sent interim tracking on final result
      onSpeechResult(newResults.trim()); // Send final result to parent
      prevInterimResult.current = ''; // Reset previous interim tracker
    } else {
      setInterimResults(newResults); // Store interim results for display
    }
  }, [onInterimUpdate, onSpeechResult]);

  const { startListening, stopListening } = useSpeechRecognition(handleResult, onInterimUpdate);

  useEffect(() => {
    if (isMicOn) {
      startListening();
      setIsListening(true);
    } else {
      stopListening();
      setIsListening(false);
      sentInterimSet.current.clear(); // Clear sent interim tracking
      prevInterimResult.current = ''; // Reset previous interim tracker
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
