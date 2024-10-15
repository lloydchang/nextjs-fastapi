// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  const startListening = useCallback(async () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    try {
      if (isMicOn) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [isListening, isMicOn]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Speech recognition stopped.');
    }
  }, [isListening]);

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
        restartTimeoutRef.current = window.setTimeout(startListening, 1000);
      }
    };

    newRecognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
      restartTimeoutRef.current = window.setTimeout(startListening, 1000);
    };

    recognitionRef.current = newRecognition;

    if (isMicOn) {
      startListening();
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      stopListening();
    };
  }, [onSpeechResult, onInterimUpdate, startListening, stopListening, isMicOn]);

  return { isListening, startListening, stopListening };
};

export default useSpeechRecognition;
