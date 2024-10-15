// File: components/state/hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';

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
  const [isManuallyStopped, setIsManuallyStopped] = useState<boolean>(false); // Tracks if recognition was stopped manually
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null); // Holds the SpeechRecognition instance
  const [restartTimeout, setRestartTimeout] = useState<NodeJS.Timeout | null>(null); // Tracks restart timeouts

  const startListening = useCallback(() => {
    if (recognition && !isListening && !isManuallyStopped) {
      try {
        recognition.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [recognition, isListening, isManuallyStopped]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      setIsManuallyStopped(true); // Mark as manually stopped
      recognition.stop();
      setIsListening(false);
      console.log('Speech recognition stopped.');
    }
  }, [recognition, isListening]);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognitionInstance = new SpeechRecognitionConstructor();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
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

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        // Automatically restart recognition after error if mic is still on
        if (isMicOn) {
          if (restartTimeout) {
            clearTimeout(restartTimeout);
          }
          setRestartTimeout(
            setTimeout(() => {
              setIsManuallyStopped(false); // Allow auto-restart again
              startListening();
            }, 3000) // Increased the restart delay to 3 seconds for smoother transition
          );
        }
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended.');
        setIsListening(false);

        // Automatically restart recognition when it ends, if the mic is still on and it wasn't manually stopped
        if (isMicOn && !isManuallyStopped) {
          if (restartTimeout) {
            clearTimeout(restartTimeout);
          }
          setRestartTimeout(
            setTimeout(() => {
              startListening();
            }, 3000) // Increased the restart delay to 3 seconds for smoother transition
          );
        }
      };

      // Store the recognition instance in state
      setRecognition(recognitionInstance);
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }

    // Cleanup function to stop recognition and clear timeouts
    return () => {
      if (recognition) {
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.abort();
        setRecognition(null);
      }
      setIsListening(false);
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate, recognition, restartTimeout, startListening]);

  useEffect(() => {
    // Start or stop listening based on the mic's state
    if (isMicOn && !isListening) {
      startListening();
    } else if (!isMicOn && isListening) {
      stopListening();
    }

    return () => {
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
    };
  }, [isMicOn, startListening, stopListening, isListening, restartTimeout]);

  // Return whether the system is currently listening
  return { isListening };
};

export default useSpeechRecognition;
