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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isManuallyStopped, setIsManuallyStopped] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [restartTimeout, setRestartTimeout] = useState<NodeJS.Timeout | null>(null);

  const startListening = useCallback(() => {
    if (recognition && !isListening && !isManuallyStopped && isMicOn) {
      try {
        recognition.start();
        setIsListening(true);
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [recognition, isListening, isManuallyStopped, isMicOn]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      setIsManuallyStopped(true);
      recognition.stop();
      setIsListening(false);
      console.log('Speech recognition stopped.');
    }
  }, [recognition, isListening]);

  useEffect(() => {
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
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        console.log('Final Transcript:', finalTranscript);
        onSpeechResult(finalTranscript.trim());
      }

      if (interimTranscript) {
        console.log('Interim Transcript:', interimTranscript);
        onInterimUpdate(interimTranscript.trim());
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (isMicOn && !isManuallyStopped) {
        if (restartTimeout) {
          clearTimeout(restartTimeout);
        }
        setRestartTimeout(
          setTimeout(() => {
            setIsManuallyStopped(false);
            startListening();
          }, 3000)
        );
      }
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended.');
      setIsListening(false);

      if (isMicOn && !isManuallyStopped) {
        if (restartTimeout) {
          clearTimeout(restartTimeout);
        }
        setRestartTimeout(
          setTimeout(() => {
            startListening();
          }, 3000)
        );
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.onend = null;
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.abort();
        setRecognition(null);
      }
      setIsListening(false);
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
    };
  }, [isMicOn, onSpeechResult, onInterimUpdate, restartTimeout, startListening]);

  useEffect(() => {
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
  }, [isMicOn, isListening, startListening, stopListening, restartTimeout]);

  return { isListening };
};

export default useSpeechRecognition;
