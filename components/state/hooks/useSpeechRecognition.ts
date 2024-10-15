// File: components/state/hooks/useSpeechRecognition.ts

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
  const isRecognitionActive = useRef<boolean>(false); // New state to track active status
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isRecognitionActive.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isRecognitionActive.current = true;
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening && isRecognitionActive.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      isRecognitionActive.current = false;
      console.log('Speech recognition stopped.');
    }
  }, [isListening]);

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
          console.log('SpeechRecognition - Final Transcript:', finalTranscript);
          onSpeechResult(finalTranscript.trim());
        }

        if (interimTranscript) {
          console.log('SpeechRecognition - Interim Transcript:', interimTranscript);
          onInterimUpdate(interimTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        isRecognitionActive.current = false; // Ensure recognition is marked as stopped

        if (isMicOn) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended.');
        setIsListening(false);
        isRecognitionActive.current = false; // Ensure recognition is marked as stopped

        if (isMicOn) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000);
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
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsListening(false);
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate, startListening]);

  // Ensure consistent start/stop logic
  useEffect(() => {
    if (isMicOn && !isListening && !isRecognitionActive.current) {
      startListening();
    } else if (!isMicOn && isListening && isRecognitionActive.current) {
      stopListening();
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isMicOn, startListening, stopListening, isListening]);

  return { isListening };
};

export default useSpeechRecognition;
