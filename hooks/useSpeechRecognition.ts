// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onInterimUpdate: (interimTranscript: string) => void
): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Initialize SpeechRecognition API
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true; // Keep listening until explicitly stopped
      recog.interimResults = true; // Capture interim results
      recog.lang = 'en-US';

      recog.onresult = (event: SpeechRecognitionEvent) => {
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
          onResult(finalTranscript.trim(), true); // Send final result
        }

        if (interimTranscript) {
          onInterimUpdate(interimTranscript.trim()); // Send interim result
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
        console.log('Recognition ended.');
      };

      setRecognition(recog);
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, [onResult, onInterimUpdate]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start(); // Start speech recognition
      setIsListening(true); // Track recognition activity
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop(); // Stop speech recognition
      setIsListening(false); // Reset recognition state
    }
  }, [recognition, isListening]);

  return { startListening, stopListening, isListening };
};
