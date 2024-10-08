import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
}

const useSpeechRecognition = ({
  isMicOn,
  onSpeechResult,
  onInterimUpdate,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
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
          onSpeechResult(finalTranscript.trim());
        }

        if (interimTranscript) {
          onInterimUpdate(interimTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
        if (isMicOn) {
          startListening();
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended. Restarting...');
        setIsListening(false);
        if (isMicOn) {
          startListening();
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        stopListening();
      }
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate, startListening]);

  useEffect(() => {
    if (isMicOn) {
      startListening();
    } else {
      stopListening();
    }
  }, [isMicOn, startListening, stopListening]);

  return { isListening };
};

export default useSpeechRecognition;