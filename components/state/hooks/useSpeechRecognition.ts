// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
  isMicOn?: boolean;
  toggleMic: () => Promise<void>; // Pass toggleMic to manage the mic state alongside speech recognition
}

const useSpeechRecognition = ({
  onSpeechResult,
  onInterimUpdate,
  isMicOn = false,
  toggleMic,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const startListening = useCallback(async () => {
    if (!recognition || isListening) return;

    try {
      await toggleMic(); // Ensure mic is on when starting listening
      recognition.start();
      setIsListening(true);
      console.log('Speech recognition started.');
    } catch (error) {
      console.error('Failed to start recognition or toggle mic:', error);
    }
  }, [recognition, isListening, toggleMic]);

  const stopListening = useCallback(async () => {
    if (!recognition || !isListening) return;

    recognition.stop();
    setIsListening(false);
    await toggleMic(); // Ensure mic is off when stopping listening
    console.log('Speech recognition stopped.');
  }, [recognition, isListening, toggleMic]);

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
      stopListening(); // Stop listening if there is an error
    };

    newRecognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
    };

    setRecognition(newRecognition);

    return () => {
      newRecognition.abort(); // Cleanup
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
