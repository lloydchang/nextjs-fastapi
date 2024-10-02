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
  const isRecognitionActiveRef = useRef<boolean>(false); // Track if recognition is currently active

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true; // Continuous listening mode
      recognition.interimResults = true; // Capture interim results
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started.');
        setIsListening(true);
        isRecognitionActiveRef.current = true; // Set recognition active flag to true
      };

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
          console.log('Final result received:', finalTranscript.trim());
          setResults((prev) => prev + finalTranscript.trim() + ' ');
          onSpeechResult(finalTranscript.trim());
          setInterimResults('');
        }

        if (interimTranscript) {
          console.log('Interim result received:', interimTranscript.trim());
          setInterimResults(interimTranscript.trim());
          onInterimUpdate(interimTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
        isRecognitionActiveRef.current = false; // Set recognition active flag to false
        if (isMicOn) {
          console.log('Restarting recognition due to error.');
          if (!isRecognitionActiveRef.current) { // Only restart if not already active
            recognition.start();
            isRecognitionActiveRef.current = true;
            setIsListening(true);
          }
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended.');
        setIsListening(false);
        isRecognitionActiveRef.current = false; // Set recognition active flag to false
        if (isMicOn) {
          console.log('Restarting recognition as mic is still on.');
          if (!isRecognitionActiveRef.current) { // Only restart if not already active
            recognition.start();
            isRecognitionActiveRef.current = true;
            setIsListening(true);
          }
        }
      };

      recognitionRef.current = recognition; // Save the recognition instance
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null; // Clean up the recognition instance
      }
    };
  }, [onSpeechResult, onInterimUpdate, isMicOn]);

  useEffect(() => {
    if (isMicOn && recognitionRef.current) {
      console.log('Mic is turned on. Starting recognition...');
      if (!isRecognitionActiveRef.current) {
        recognitionRef.current.start(); // Start recognition when mic is on
        isRecognitionActiveRef.current = true;
        setIsListening(true);
      }
    } else if (recognitionRef.current) {
      console.log('Mic is turned off. Stopping recognition...');
      recognitionRef.current.stop(); // Stop recognition when mic is off
      setIsListening(false);
      isRecognitionActiveRef.current = false;
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
