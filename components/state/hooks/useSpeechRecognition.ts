// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
  isMicOn?: boolean;
  onEnd?: () => void; // Optional callback triggered when recognition ends
}

const useSpeechRecognition = ({
  onSpeechResult,
  onInterimUpdate,
  isMicOn = false,
  onEnd,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const initializeRecognition = useCallback(() => {
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
        if (event.results[i].isFinal) final += `${transcript} `;
        else interim += `${transcript} `;
      }

      if (final) onSpeechResult(final.trim());
      if (interim) onInterimUpdate(interim.trim());
    };

    newRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') stopListening();
    };

    newRecognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
      setIsRecognitionActive(false);
      if (onEnd) onEnd();
    };

    newRecognition.onstart = () => {
      console.log('Speech recognition started.');
      setIsRecognitionActive(true);
    };

    setRecognition(newRecognition);
  }, [onSpeechResult, onInterimUpdate, onEnd]);

  const startListening = useCallback(() => {
    if (!recognition || isRecognitionActive) return;

    try {
      recognition.start();
      setIsListening(true);
      console.log('Speech recognition started.');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [recognition, isRecognitionActive]);

  const stopListening = useCallback(() => {
    if (!recognition || !isRecognitionActive) return;

    recognition.stop();
    setIsListening(false);
    console.log('Speech recognition stopped.');
  }, [recognition, isRecognitionActive]);

  useEffect(() => {
    initializeRecognition();

    return () => {
      if (recognition) {
        recognition.abort();
        setRecognition(null);
      }
    };
  }, [initializeRecognition, recognition]);

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
