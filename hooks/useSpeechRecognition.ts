// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognitionResultCallback = (
  transcript: string,
  isFinal: boolean
) => void;

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

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Browser does not support SpeechRecognition');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
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

  const startHearing = useCallback(() => {
    if (recognitionRef.current && !isRecognitionRunning) {
      recognitionRef.current.start();
      setIsRecognitionRunning(true);
    }
  }, [isRecognitionRunning]);

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
