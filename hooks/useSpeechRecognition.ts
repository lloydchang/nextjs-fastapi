// hooks/useSpeechRecognition.ts
import { useState, useEffect, useRef } from 'react';
import { Message } from '../types/message';

export const useSpeechRecognition = () => {
  const [isHearingOn, setIsHearingOn] = useState(false);
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setMessages((prev) => [...prev, { sender: 'user', text: event.results[i][0].transcript }]); // Handle final transcript
          } else {
            interimTranscript += event.results[i][0].transcript; // Append interim transcript
          }
        }

        // Update last message with interim transcript
        if (interimTranscript) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { sender: 'user', text: interimTranscript },
          ]);
        }
      };

      recognition.onend = () => {
        setIsHearingOn(false);
        setIsRecognitionRunning(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsHearingOn(false);
        setIsRecognitionRunning(false);
      };
    } else {
      console.error('SpeechRecognition API is not supported in this browser.');
    }
  }, []);

  const startHearing = () => {
    if (recognitionRef.current && !isRecognitionRunning) {
      recognitionRef.current.start();
      setIsHearingOn(true);
      setIsRecognitionRunning(true);
    }
  };

  const stopHearing = () => {
    if (recognitionRef.current && isRecognitionRunning) {
      recognitionRef.current.stop();
      setIsHearingOn(false);
      setIsRecognitionRunning(false);
    }
  };

  return { startHearing, stopHearing, isHearingOn, isRecognitionRunning, recognitionRef };
};
