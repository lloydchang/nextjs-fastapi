// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onInterimUpdate: (interimTranscript: string) => void
): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true; // Keep listening until explicitly stopped
      recog.interimResults = true; // Capture interim results
      recog.lang = 'en-US';

      recog.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim();
          const isFinal = event.results[i].isFinal;

          // Call the appropriate function based on whether the result is final or interim
          if (isFinal) {
            onResult(transcript, true); // Send final result
          } else {
            onInterimUpdate(transcript); // Send interim result directly
          }
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsRecognizing(false);
      };

      recog.onend = () => {
        setIsRecognizing(false);
        console.log('Recognition ended, restarting...');
        recog.start(); // Auto-restart
        setIsRecognizing(true);
      };

      setRecognition(recog);
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, [onResult, onInterimUpdate]);

  const startListening = useCallback(() => {
    if (recognition && !isRecognizing) {
      recognition.start(); // Start speech recognition
      setIsRecognizing(true); // Track that recognition is active
    }
  }, [recognition, isRecognizing]);

  const stopListening = useCallback(() => {
    if (recognition && isRecognizing) {
      recognition.stop(); // Stop speech recognition
      setIsRecognizing(false); // Reset recognizing state
    }
  }, [recognition, isRecognizing]);

  return { startListening, stopListening };
};
