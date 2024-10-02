import React, { useEffect, useRef, useState } from 'react';

interface TestSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (result: string) => void;
}

const TestSpeechRecognition: React.FC<TestSpeechRecognitionProps> = ({ isMicOn, onSpeechResult }) => {
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const resultsCacheRef = useRef<SpeechRecognitionResult[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        resultsCacheRef.current = Array.from(event.results);
        updateTranscript();
      };

      recognitionRef.current.onend = () => {
        if (isMicOn) {
          recognitionRef.current?.start();
        }
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
  }, [isMicOn, onSpeechResult]);

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
      resultsCacheRef.current = resultsCacheRef.current.filter(result => !result.isFinal);
      updateTranscript();
    }
  };

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