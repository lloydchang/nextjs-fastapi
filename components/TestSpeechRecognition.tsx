import React, { useEffect, useRef, useState } from 'react';

interface TestSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (result: string) => void;
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult }) => {
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            onSpeechResult(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onSpeechResult]);

  useEffect(() => {
    if (isMicOn && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (!isMicOn && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isMicOn]);

  return (
    <div>
      <p><strong>{isMicOn ? 'Listening 👂' : 'Not Listening 🙉'}</strong></p>
      <p><strong>Interim Result:</strong> {transcript}</p>
    </div>
  );
};

export default TestSpeechRecognition;