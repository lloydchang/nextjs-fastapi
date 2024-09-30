// hooks/useSpeechRecognition.ts
import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognitionResultCallback = (transcript: string, isFinal: boolean) => void;

interface SpeechRecognitionHook {
  startHearing: () => void;
  stopHearing: () => void;
  isRecognitionRunning: boolean;
}

export const useSpeechRecognition = (
  onResult: SpeechRecognitionResultCallback
): SpeechRecognitionHook => {
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>(''); // Keep track of the last confirmed transcript
  const interimTranscriptCacheRef = useRef<string>(''); // Maintain interim transcripts during speech

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Browser does not support SpeechRecognition');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Capture interim results for live feedback
    recognition.continuous = true; // Keep listening until manually stopped

    // Handle speech results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Iterate through speech results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript; // Collect final transcripts
        } else {
          interimTranscript += transcript; // Collect interim transcripts
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current = finalTranscript;
        interimTranscriptCacheRef.current = ''; // Clear interim cache on final transcript
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        interimTranscriptCacheRef.current = interimTranscript; // Update interim cache
        onResult(interimTranscript, false);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsRecognitionRunning(false);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  // Start speech recognition
  const startHearing = useCallback(() => {
    if (recognitionRef.current && !isRecognitionRunning) {
      recognitionRef.current.start();
      setIsRecognitionRunning(true);
    }
  }, [isRecognitionRunning]);

  // Stop speech recognition
  const stopHearing = useCallback(() => {
    if (recognitionRef.current && isRecognitionRunning) {
      recognitionRef.current.stop();
      setIsRecognitionRunning(false);
    }
  }, [isRecognitionRunning]);

  return {
    startHearing,
    stopHearing,
    isRecognitionRunning,
  };
};
