import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [isListening, setIsListening] = useState<boolean>(false); // Track the actual listening state
  const [interimTranscript, setInterimTranscript] = useState<string>(''); // Track interim speech results
  const [finalTranscript, setFinalTranscript] = useState<string>(''); // Track final speech results
  const recognitionRef = useRef<SpeechRecognition | null>(null); // Store recognition instance in ref to avoid re-initialization
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Use ref to track restart timeout
  const audioStreamRef = useRef<MediaStream | null>(null); // Store microphone stream reference

  // Start listening logic
  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;

    if (!audioStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,    // Enable echo cancellation
            noiseSuppression: true,    // Enable noise suppression
            autoGainControl: true,     // Automatically control microphone gain
          },
        });
        audioStreamRef.current = stream; // Save the audio stream reference
      } catch (error) {
        console.error('Error accessing microphone:', error);
        return;
      }
    }

    if (recognition && !isListening && isMicOn) {
      try {
        recognition.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [isListening, isMicOn]);

  // Stop listening logic
  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    const stream = audioStreamRef.current;

    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      console.log('Speech recognition stopped.');
    }

    // Stop audio tracks when stopping recognition
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }, [isListening]);

  useEffect(() => {
    // Initialize SpeechRecognition only once
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognitionConstructor();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript + ' ';
        }
      }

      if (final) {
        console.log('Final Transcript:', final);
        setFinalTranscript(final.trim()); // Update final result in state
        onSpeechResult(final.trim()); // Propagate the final result to the parent
      }

      if (interim) {
        console.log('Interim Transcript:', interim);
        setInterimTranscript(interim.trim()); // Update interim result in state
        onInterimUpdate(interim.trim()); // Propagate the interim result to the parent
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false); // Stop listening if there's an error

      // Only restart if the mic is on
      if (isMicOn) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          startListening(); // Restart after a delay only if mic is still on
        }, 3000);
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false); // Set listening to false when recognition ends

      // Only restart if the mic is on and we didn't manually stop
      if (isMicOn) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          startListening(); // Restart after a delay only if mic is still on
        }, 3000);
      }
    };

    recognitionRef.current = recognitionInstance;

    return () => {
      // Cleanup on unmount
      const recognition = recognitionRef.current;
      const stream = audioStreamRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.abort(); // Ensure we stop everything
        recognitionRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate, startListening]);

  useEffect(() => {
    // Control when to start/stop based on isMicOn state
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
  }, [isMicOn, isListening, startListening, stopListening]);

  return {
    isListening,
    interimTranscript, // Return interim transcript
    finalTranscript,   // Return final transcript
  };
};

export default useSpeechRecognition;
