// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  startHearing: () => void;
  stopHearing: () => void;
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void
): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US'; // Set the language as needed

      recog.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          onResult(transcript, isFinal);
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        // Optionally, handle errors without stopping the microphone
      };

      setRecognition(recog);
    } else {
      console.warn('SpeechRecognition not supported in this browser.');
    }
  }, [onResult]);

  const startHearing = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [recognition]);

  const stopHearing = useCallback(() => {
    if (recognition) {
      recognition.stop();
      console.log('Speech recognition stopped.');
    }
  }, [recognition]);

  return { startHearing, stopHearing };
};
