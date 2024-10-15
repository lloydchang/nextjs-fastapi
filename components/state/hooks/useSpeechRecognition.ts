// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  isMicOn: boolean;
  onSpeechResult: (finalResults: string) => void;
  onInterimUpdate: (interimResult: string) => void;
}

const useSpeechRecognition = ({
  isMicOn,
  onSpeechResult,
  onInterimUpdate,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState<boolean>(false); // Tracks whether the mic is currently listening
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Ref to hold the SpeechRecognition instance
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to manage restart timeouts

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('Speech recognition stopped.');
    }
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Collect the interim and final results from the event
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript + ' ';
          }
        }

        // Pass final results to the provided callback
        if (finalTranscript) {
          console.log('Final Transcript:', finalTranscript);
          onSpeechResult(finalTranscript.trim());
        }

        // Pass interim results to the provided callback
        if (interimTranscript) {
          console.log('Interim Transcript:', interimTranscript);
          onInterimUpdate(interimTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        // Automatically restart recognition after error if mic is still on
        if (isMicOn) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000); // Restart after a 1-second delay
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended.');
        setIsListening(false);

        // Automatically restart recognition when it ends, if the mic is still on
        if (isMicOn) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000); // Restart after a 1-second delay
        }
      };

      // Store the recognition instance in the ref
      recognitionRef.current = recognition;
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    // Cleanup function to stop recognition and clear timeouts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsListening(false);
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate, startListening]);

  useEffect(() => {
    // Start or stop listening based on the mic's state
    if (isMicOn && !isListening) {
      startListening();
    } else if (!isMicOn && isListening) {
      stopListening();
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isMicOn, startListening, stopListening, isListening]);

  // Return whether the system is currently listening
  return { isListening };
};

export default useSpeechRecognition;
