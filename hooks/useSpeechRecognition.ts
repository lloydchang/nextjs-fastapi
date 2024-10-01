import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onInterimUpdate: (interimTranscript: string) => void,
  deduplicate: boolean = false, // Deduplication flag
  trimResults: boolean = false // Trimming flag
): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const lastInterim = useRef<string>(''); // Track last interim result

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event: SpeechRecognitionEvent) => {
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
          if (!deduplicate || finalTranscript.trim() !== lastInterim.current.trim()) {
            onResult(finalTranscript.trim(), true); // Final result handling
          }
          lastInterim.current = ''; // Clear interim after final
        }

        if (interimTranscript) {
          if (!deduplicate || interimTranscript.trim() !== lastInterim.current.trim()) {
            lastInterim.current = interimTranscript.trim();
            onInterimUpdate(interimTranscript.trim()); // Interim result handling
          }
        }
      };

      recog.onerror = (event: any) => {
        setIsListening(false);
        console.error('Speech recognition error:', event);
      };

      recog.onend = () => {
        setIsListening(false);
        console.log('Recognition ended.');
      };

      setRecognition(recog);
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, [onResult, onInterimUpdate, deduplicate, trimResults]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return { startListening, stopListening, isListening };
};
