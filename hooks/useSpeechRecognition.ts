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
    // Check for browser support for SpeechRecognition
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true; // Keep listening for speech input continuously
      recog.interimResults = true; // Allow interim results to be captured
      recog.lang = 'en-US'; // Set the language to English

      // Handle speech recognition results
      recog.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          console.log(`Speech result: "${transcript}", isFinal: ${isFinal}`);
          onResult(transcript, isFinal); // Trigger callback with the result
        }
      };

      // Handle errors in speech recognition
      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsRecognizing(false); // Reset recognizing state on error
        console.warn('Speech recognition encountered an error:', event.error);
      };

      // Handle the end of the speech recognition session
      recog.onend = () => {
        console.log('Speech recognition ended.');
        setIsRecognizing(false); // Update state when recognition ends
      };

      setRecognition(recog); // Save the recognition instance
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, [onResult]);

  // Start the speech recognition process
  const startHearing = useCallback(() => {
    if (recognition && !isRecognizing) {
      try {
        recognition.start(); // Start speech recognition
        setIsRecognizing(true); // Track that recognition is active
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [recognition, isRecognizing]);

  // Stop the speech recognition process
  const stopHearing = useCallback(() => {
    if (recognition && isRecognizing) {
      recognition.stop(); // Stop speech recognition
      setIsRecognizing(false); // Reset recognizing state
      console.log('Speech recognition stopped.');
    }
  }, [recognition, isRecognizing]);

  return { startHearing, stopHearing };
};
