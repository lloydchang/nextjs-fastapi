// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback, useRef } from 'react';

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
  onEnd, // Handle onEnd callback
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false); // Track recognition state
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Store recognition instance

  const initializeRecognition = useCallback(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') stopListening();
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);
      setIsRecognitionActive(false); // Mark as inactive
      if (onEnd) onEnd(); // Trigger optional onEnd callback
    };

    recognition.onstart = () => {
      console.log('Speech recognition started.');
      setIsRecognitionActive(true); // Mark as active
    };

    recognitionRef.current = recognition;
  }, [onSpeechResult, onInterimUpdate, onEnd]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isRecognitionActive) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('Speech recognition started.');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [isRecognitionActive]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isRecognitionActive) return;

    recognitionRef.current.stop();
    setIsListening(false);
    console.log('Speech recognition stopped.');
  }, [isRecognitionActive]);

  useEffect(() => {
    initializeRecognition(); // Initialize recognition on mount

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort(); // Clean up on unmount
        recognitionRef.current = null;
      }
    };
  }, [initializeRecognition]);

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
