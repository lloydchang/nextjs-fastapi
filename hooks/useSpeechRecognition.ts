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
  const [isRecognizing, setIsRecognizing] = useState(false); // Track recognition state

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
          console.log(`Speech result: "${transcript}", isFinal: ${isFinal}`);
          onResult(transcript, isFinal);
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsRecognizing(false); // Set recognizing state to false on error
        console.warn('Speech recognition encountered an error: ', event.error);
      };

      recog.onend = () => {
        console.log('Speech recognition ended.');
        setIsRecognizing(false); // Update state when recognition ends
      };

      setRecognition(recog);
    } else {
      console.warn('SpeechRecognition not supported in this browser.');
    }
  }, [onResult]);

  const startHearing = useCallback(() => {
    if (recognition && !isRecognizing) {
      try {
        recognition.start();
        setIsRecognizing(true); // Track that recognition is active
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [recognition, isRecognizing]);

  const stopHearing = useCallback(() => {
    if (recognition && isRecognizing) {
      recognition.stop();
      setIsRecognizing(false); // Reset recognizing state
      console.log('Speech recognition stopped.');
    }
  }, [recognition, isRecognizing]);

  return { startHearing, stopHearing };
};
