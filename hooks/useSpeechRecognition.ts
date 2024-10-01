// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionReturn {
  startHearing: () => void;
  stopHearing: () => void;
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void
): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false); // Track recognition state

  // Create a ref to track the timeout ID
  const pauseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for browser support for SpeechRecognition
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true; // Keep listening for speech input continuously
      recog.interimResults = true; // Allow interim results to be captured
      recog.lang = 'en-US'; // Set the language to English
      recog.maxAlternatives = 1; // Limit alternatives for faster processing

      // Handle speech recognition results
      recog.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;

          // Detect a pause and consider interim results as final if a short pause is detected
          if (!isFinal) {
            // Reset the previous pause timeout
            if (pauseTimeoutRef.current) {
              clearTimeout(pauseTimeoutRef.current);
            }

            // Set a new timeout to consider this interim result as final after 300ms of silence
            pauseTimeoutRef.current = window.setTimeout(() => {
              console.log(`Mini-pause detected, considering interim as final: "${transcript}"`);
              onResult(transcript, true); // Treat as final
              pauseTimeoutRef.current = null; // Clear the timeout
            }, 300); // Adjust the time threshold here for sensitivity to pauses
          }

          onResult(transcript, isFinal);
          console.log(`Speech result: "${transcript}", isFinal: ${isFinal}`);
        }
      };

      // Handle errors in speech recognition
      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsRecognizing(false); // Reset recognizing state on error
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
