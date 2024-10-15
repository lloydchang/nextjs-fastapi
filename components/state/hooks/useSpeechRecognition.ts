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
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Speech recognition stopped.');
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
          console.log('Final Transcript:', finalTranscript);
          onSpeechResult(finalTranscript.trim());
        }

        if (interimTranscript) {
          console.log('Interim Transcript:', interimTranscript);
          onInterimUpdate(interimTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended.');
        setIsListening(false);
        if (isMicOn) {
          recognition.start(); // Restart if mic is on
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate]);

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
