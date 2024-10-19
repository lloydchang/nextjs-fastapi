// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

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
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request microphone permissions on initialization
  const requestMicrophonePermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted.');
    } catch (err) {
      setError('Microphone permission denied.');
      console.error('Microphone permission denied:', err);
    }
  }, []);

  // Initialize the speech recognition instance
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

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false); // Update state when recognition ends
      onEnd?.(); // Trigger onEnd callback if provided
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      if (event.error !== 'no-speech') stopListening();
    };

    setRecognition(recognitionInstance);
    return recognitionInstance;
  }, [onSpeechResult, onInterimUpdate, onEnd]);

  // Start listening with the initialized recognition instance
  const startListening = useCallback(() => {
    if (!recognition) return;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      console.log('Listening started.');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start recognition.');
    }
  }, [recognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognition) return;

    recognition.stop();
    console.log('Listening stopped.');
  }, [recognition]);

  // Request mic permissions and start listening on mount
  useEffect(() => {
    const initializeMicAndListen = async () => {
      await requestMicrophonePermission(); // Ensure mic permissions are granted
      const recognitionInstance = initializeRecognition(); // Initialize recognition

      if (recognitionInstance) {
        startListening(); // Start listening immediately
      }
    };

    initializeMicAndListen(); // Trigger on mount
    return () => recognition?.stop(); // Cleanup on unmount
  }, [initializeRecognition, requestMicrophonePermission, startListening, recognition]);

  return { isListening, startListening, stopListening, error };
};

export default useSpeechRecognition;
