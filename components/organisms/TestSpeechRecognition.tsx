// File: components/TestSpeechRecognition.tsx

import React, { useEffect, useState, useRef } from 'react';
import styles from 'styles/components/organisms/TestSpeechRecognition.module.css';

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

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      recognitionRef.current = new SpeechRecognitionConstructor(); // Assign to ref
      recognitionRef.current.continuous = true; // Continuous listening mode
      recognitionRef.current.interimResults = true; // Capture interim results
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
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
          setInterimResults(''); // Clear interim results once final result is received
        }

        if (interimTranscript) {
          setInterimResults(interimTranscript.trim());
          onInterimUpdate(interimTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
        // Restart recognition on error
        if (isMicOn && recognitionRef.current) {
          recognitionRef.current.start(); // Use ref
          setIsListening(true);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended. Restarting...');
        setIsListening(false);
        if (isMicOn && recognitionRef.current) {
          recognitionRef.current.start(); // Restart using ref
          setIsListening(true);
        }
      };
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
    };
  }, [onSpeechResult, onInterimUpdate, isMicOn]);

  useEffect(() => {
    if (isMicOn && recognitionRef.current) {
      recognitionRef.current.start(); // Use ref to start recognition
      setIsListening(true);
    } else if (recognitionRef.current) {
      recognitionRef.current.stop(); // Use ref to stop recognition
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
