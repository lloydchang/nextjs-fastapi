// hooks/useSpeechRecognition.ts
import { useRef, useState, useEffect } from 'react';

// Define the SpeechRecognition type manually if it does not exist
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionAlternative {
    readonly confidence: number;
    readonly transcript: string;
  }
}

type SpeechRecognition =
  | typeof window.SpeechRecognition
  | typeof window.webkitSpeechRecognition;

interface SpeechRecognitionHook {
  isRecognitionRunning: boolean;
  startHearing: () => void;
  stopHearing: () => void;
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void
): SpeechRecognitionHook => {
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>(''); // Keep track of the last confirmed transcript
  const interimTranscriptCacheRef = useRef<string>(''); // Maintain interim transcripts during speech

  // Setup the speech recognition on mount
  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      console.error('Speech Recognition API not supported in this browser.');
      return;
    }

    // Use webkitSpeechRecognition for cross-browser support
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionClass();

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
          onResult(finalTranscriptRef.current, true);
        } else {
          interimTranscript += transcript;
        }
      }
      interimTranscriptCacheRef.current = interimTranscript;
      onResult(interimTranscriptCacheRef.current, false);
    };
  }, [onResult]);

  // Start speech recognition
  const startHearing = () => {
    if (recognitionRef.current) {
      setIsRecognitionRunning(true);
      recognitionRef.current.start();
    }
  };

  // Stop speech recognition
  const stopHearing = () => {
    if (recognitionRef.current) {
      setIsRecognitionRunning(false);
      recognitionRef.current.stop();
    }
  };

  return {
    isRecognitionRunning,
    startHearing,
    stopHearing,
  };
};
