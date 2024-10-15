// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
  isMicOn?: boolean;
}

const useSpeechRecognition = ({
  onSpeechResult,
  onInterimUpdate,
  isMicOn = false,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!recognition || isListening) return; // Check if already listening to avoid re-starting

    recognition.start();
    setIsListening(true);
    console.log('Speech recognition started.');
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (!recognition || !isListening) return; // Only stop if currently listening

    recognition.stop();
    setIsListening(false);
    console.log('Speech recognition stopped.');
  }, [recognition, isListening]);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    const newRecognition = new SpeechRecognitionConstructor();
    newRecognition.continuous = true;
    newRecognition.interimResults = true;
    newRecognition.lang = 'en-US';

    newRecognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) final += transcript + ' ';
        else interim += transcript + ' ';
      }

      if (final) onSpeechResult(final.trim());
      if (interim) onInterimUpdate(interim.trim());
    };

    newRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        stopListening();
      }
    };

    newRecognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
    };

    setRecognition(newRecognition);

    return () => {
      newRecognition.abort(); // Clean up
    };
  }, [onSpeechResult, onInterimUpdate, stopListening]);

  useEffect(() => {
    if (isMicOn && !isListening) {
      startListening();
    } else if (!isMicOn && isListening) {
      stopListening();
    }
  }, [isMicOn, isListening, startListening, stopListening]);

  return { isListening, startListening, stopListening };
};

export default useSpeechRecognition;
