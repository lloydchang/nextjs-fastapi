// File: components/organisms/TestSpeechRecognition.tsx

import React, { useEffect, useRef, useState } from 'react';
import 'speech-recognition.d.ts'; // Import the custom type declarations

interface TestSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (result: string) => void;
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult }) => {
  const [transcript, setTranscript] = useState<string>('');  // Store interim results
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const resultsCacheRef = useRef<SpeechRecognitionResult[]>([]);  // Cache for results
  const isRecognitionActiveRef = useRef<boolean>(false);  // Track if recognition is active
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Timeout for restart delay
  const retryCountRef = useRef<number>(0); // Track retry attempts for exponential backoff

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      // Handle recognition start
      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;
        retryCountRef.current = 0; // Reset retry count on successful start
        console.log('Speech recognition started.');
      };

      // Handle recognition end and potentially restart
      recognitionRef.current.onend = () => {
        isRecognitionActiveRef.current = false;
        console.log('Speech recognition ended.');
        if (isMicOn) {
          restartRecognitionWithDelay();
        }
      };

      // Handle results and update transcript
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        resultsCacheRef.current = Array.from(event.results);
        updateTranscript();
      };

      // Handle errors and attempt to restart with exponential backoff
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (isMicOn) {
          restartRecognitionWithDelay(); // Restart on error
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isMicOn, onSpeechResult]);

  // Function to restart recognition safely with exponential backoff
  const restartRecognitionWithDelay = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    // Exponential backoff logic
    const delay = Math.min(1000 * 2 ** retryCountRef.current, 10000);  // Max delay of 10 seconds
    retryCountRef.current += 1;

    restartTimeoutRef.current = setTimeout(() => {
      if (!isRecognitionActiveRef.current && recognitionRef.current) {
        recognitionRef.current.start();
        retryCountRef.current = 0;  // Reset retry count on success
      }
    }, delay);
  };

  // Function to update the transcript with final and interim results
  const updateTranscript = () => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = 0; i < resultsCacheRef.current.length; ++i) {
      if (resultsCacheRef.current[i].isFinal) {
        finalTranscript += resultsCacheRef.current[i][0].transcript;
      } else {
        interimTranscript += resultsCacheRef.current[i][0].transcript;
      }
    }

    setTranscript(interimTranscript);

    if (finalTranscript) {
      onSpeechResult(finalTranscript);
      resultsCacheRef.current = resultsCacheRef.current.filter(result => !result.isFinal);  // Clear final results from cache
      updateTranscript();  // Recursively update transcript if more results
    }
  };

  // Effect to start or stop recognition based on isMicOn state
  useEffect(() => {
    if (isMicOn && recognitionRef.current && !isRecognitionActiveRef.current) {
      recognitionRef.current.start();  // Start recognition if not already active
    } else if (!isMicOn && recognitionRef.current && isRecognitionActiveRef.current) {
      recognitionRef.current.stop();  // Stop recognition if active
    }
  }, [isMicOn]);

  return (
    <div>
      <p><strong>{isMicOn ? 'Listening 👂' : 'Not Listening 🙉 '}</strong></p>
      <p><strong>Interim Results:</strong> {transcript}</p>
    </div>
  );
};

export default TestSpeechRecognition;
