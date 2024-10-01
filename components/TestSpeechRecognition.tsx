// components/TestSpeechRecognition.tsx

import React, { useEffect, useState, useRef } from 'react';
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
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Store the recognition instance

  useEffect(() => {
    // Initialize the SpeechRecognition API
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true; // Keep listening until explicitly stopped
      recognition.interimResults = true; // Capture interim results
      recognition.lang = 'en-US';

      // Handle speech recognition results
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
          setResults(finalTranscript.trim()); // Update the final result state
          onSpeechResult(finalTranscript.trim()); // Send final results to parent via prop
          setInterimResults(''); // Clear interim results after final results are captured
        }

        if (interimTranscript) {
          setInterimResults(interimTranscript.trim()); // Store interim results for display
          onInterimUpdate(interimTranscript.trim()); // Send interim results to parent
        }
      };

      // Handle recognition errors
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
      };

      // Handle recognition end
      recognition.onend = () => {
        console.log('Speech recognition ended.');
        setIsListening(false);
      };

      recognitionRef.current = recognition; // Store the recognition instance
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    // Cleanup recognition instance on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current = null;
      }
    };
  }, [onSpeechResult, onInterimUpdate]);

  // Effect to control the microphone based on `isMicOn` prop
  useEffect(() => {
    if (isMicOn && recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
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
