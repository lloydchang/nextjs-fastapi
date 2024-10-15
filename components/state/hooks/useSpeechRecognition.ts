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

  // Start speech recognition
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;  // Ensure mic is on but not playing audio back
      });

      if (recognition && !isListening) {
        recognition.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [recognition, isListening]);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    // Create a new instance of SpeechRecognition
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

    newRecognition.onerror = () => {
      setIsListening(false);
      console.error('Speech recognition error, restarting...');
      startListening();  // Force restart on error
    };

    newRecognition.onend = () => {
      setIsListening(false);
      console.log('Speech recognition ended, restarting...');
      startListening();  // Force restart on end
    };

    setRecognition(newRecognition);

    // Clean up when the component unmounts
    return () => {
      newRecognition.stop();
      console.log('Speech recognition cleaned up.');
    };
  }, [onSpeechResult, onInterimUpdate, startListening]);

  // Automatically start listening when recognition is ready
  useEffect(() => {
    if (recognition && !isListening) {
      startListening();
    }
  }, [recognition, isListening, startListening]);

  return { isListening };
};

export default useSpeechRecognition;
