// components/TestSpeechRecognition.tsx

import React, { useEffect, useState, useRef } from 'react';
import styles from '../styles/TestSpeechRecognition.module.css';

interface TestSpeechRecognitionProps {
  isMicOn: boolean; // Prop to control mic state
  onSpeechResult: (finalResults: string) => void; // Callback for final results
  onInterimUpdate: (interimResult: string) => void; // Callback for interim results
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({
  isMicOn,
  onSpeechResult,
  onInterimUpdate,
}) => {
  const [results, setResults] = useState<string>(''); // Stores the final speech recognition results
  const [interimResults, setInterimResults] = useState<string>(''); // Stores the interim (in-progress) results
  const [isListening, setIsListening] = useState<boolean>(false); // Track if speech recognition is active
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Store the recognition instance
  const noInterimTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Store the timeout reference

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true; // Continuous listening mode
      recognition.interimResults = true; // Capture interim results
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setResults(finalTranscript.trim());
          onSpeechResult(finalTranscript.trim());
          setInterimResults('');
          // Clear timeout when final result is received
          if (noInterimTimeoutRef.current) {
            clearTimeout(noInterimTimeoutRef.current);
          }
        }

        if (interimTranscript) {
          setInterimResults(interimTranscript.trim());
          onInterimUpdate(interimTranscript.trim());
          // Restart timeout if there are interim results
          if (noInterimTimeoutRef.current) {
            clearTimeout(noInterimTimeoutRef.current); // Clear any existing timeout
          }
          // Set a timeout to restart recognition if no interim results for 3 seconds
          noInterimTimeoutRef.current = setTimeout(() => {
            console.log('No interim results for 3 seconds. Restarting...');
            recognition.stop(); // Stop recognition
            recognition.start(); // Restart recognition
          }, 3000); // 3 seconds
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
        // Restart recognition on error
        if (isMicOn) {
          recognition.start();
          setIsListening(true);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended. Restarting...');
        setIsListening(false);
        if (isMicOn) {
          recognition.start(); // Restart speech recognition if mic is still on
          setIsListening(true);
        }
      };

      recognitionRef.current = recognition; // Save the recognition instance
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current = null; // Clean up the recognition instance
      }
      if (noInterimTimeoutRef.current) {
        clearTimeout(noInterimTimeoutRef.current); // Clean up the timeout
      }
    };
  }, [onSpeechResult, onInterimUpdate, isMicOn]);

  useEffect(() => {
    if (isMicOn && recognitionRef.current) {
      recognitionRef.current.start(); // Start recognition when mic is on
      setIsListening(true);
    } else if (recognitionRef.current) {
      recognitionRef.current.stop(); // Stop recognition when mic is off
      setIsListening(false);
    }
  }, [isMicOn]);

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
