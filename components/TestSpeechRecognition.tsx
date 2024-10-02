import React, { useEffect, useRef, useState } from 'react';

interface TestSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (result: string) => void;
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult }) => {
  const [speech, setSpeech] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const resultsCacheRef = useRef<SpeechRecognitionResult[]>([]);
  const isRecognitionActiveRef = useRef<boolean>(false);  // Flag to track recognition state
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Ref to manage debounce for restart

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;  // Set flag to true when recognition starts
      };

      recognitionRef.current.onend = () => {
        isRecognitionActiveRef.current = false;  // Set flag to false when recognition ends
        if (isMicOn) {
          restartRecognitionWithDelay();  // Restart with delay to prevent transient states
        }
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        resultsCacheRef.current = Array.from(event.results);
        updateSpeech();
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);  // Clean up timeout if component unmounts
      }
    };
  }, [isMicOn, onSpeechResult]);

  const restartRecognitionWithDelay = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);  // Clear previous timeout if exists
    }
    restartTimeoutRef.current = setTimeout(() => {
      if (!isRecognitionActiveRef.current && recognitionRef.current) {
        recognitionRef.current.start();  // Restart safely with delay
      }
    }, 100);  // Add a slight delay (100ms) to avoid transient state errors
  };

  const updateSpeech = () => {
    let interimSpeech = '';
    let finalSpeech = '';

    for (let i = 0; i < resultsCacheRef.current.length; ++i) {
      if (resultsCacheRef.current[i].isFinal) {
        finalSpeech += resultsCacheRef.current[i][0].speech;
      } else {
        interimSpeech += resultsCacheRef.current[i][0].speech;
      }
    }

    setSpeech(interimSpeech);

    if (finalSpeech) {
      onSpeechResult(finalSpeech);
      resultsCacheRef.current = resultsCacheRef.current.filter(result => !result.isFinal);
      updateSpeech();
    }
  };

  useEffect(() => {
    if (isMicOn && recognitionRef.current && !isRecognitionActiveRef.current) {
      recognitionRef.current.start();  // Start recognition only if not active
    } else if (!isMicOn && recognitionRef.current && isRecognitionActiveRef.current) {
      recognitionRef.current.stop();  // Stop only if active
    }
  }, [isMicOn]);

  return (
    <div>
      <p><strong>{isMicOn ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
      <p><strong>Interim Results:</strong> {speech}</p>
    </div>
  );
};

export default TestSpeechRecognition;
