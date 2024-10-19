// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
  onEnd?: () => void;
}

const useSpeechRecognition = ({
  onSpeechResult,
  onInterimUpdate,
  onEnd,
}: UseSpeechRecognitionProps) => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeRecognition = useCallback(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognitionConstructor();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) final += `${transcript} `;
        else interim += `${transcript} `;
      }

      if (final) onSpeechResult(final.trim());
      if (interim) onInterimUpdate(interim.trim());
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended.');
      onEnd?.();
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
    };

    setRecognition(recognitionInstance);
  }, [onSpeechResult, onInterimUpdate, onEnd]);

  const startListening = useCallback(() => {
    if (recognition) {
      recognition.start();
      console.log('Listening started.');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      console.log('Listening stopped.');
    }
  }, [recognition]);

  return { startListening, stopListening, initializeRecognition };
};

export default useSpeechRecognition;
