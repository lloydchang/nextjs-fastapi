// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
}

const useSpeechRecognition = ({
  onSpeechResult,
  onInterimUpdate,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted.');
    } catch (err) {
      setError('Microphone permission denied.');
      console.error('Microphone permission denied:', err);
    }
  }, []);

  const initializeRecognition = useCallback(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setError('Speech recognition not supported in this browser.');
      return null;
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

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      if (event.error !== 'no-speech') stopListening();
    };

    setRecognition(recognitionInstance);
    return recognitionInstance;
  }, [onSpeechResult, onInterimUpdate]);

  const startListening = useCallback(() => {
    if (!recognition) return;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start recognition.');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;

    recognition.stop();
    setIsListening(false);
  }, [recognition]);

  useEffect(() => {
    requestMicrophonePermission();
    const recognitionInstance = initializeRecognition();
    return () => recognitionInstance?.stop();
  }, [initializeRecognition, requestMicrophonePermission]);

  return { isListening, startListening, stopListening, error };
};

export default useSpeechRecognition;
