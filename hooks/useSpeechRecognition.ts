// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  startHearing: () => void;
  stopHearing: () => void;
}

export const useSpeechRecognition = (onResult: (transcript: string, isFinal: boolean) => void): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech Recognition API not supported in this browser.');
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SpeechRecognitionClass();

    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onresult = (event: SpeechRecognitionEvent) => {
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
      }

      if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    recog.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    setRecognition(recog);
  }, [onResult]);

  const startHearing = useCallback(() => {
    if (recognition) {
      recognition.start();
    }
  }, [recognition]);

  const stopHearing = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return { startHearing, stopHearing };
};
