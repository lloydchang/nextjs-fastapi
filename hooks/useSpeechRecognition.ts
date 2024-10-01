// hooks/useSpeechRecognition.ts

import { useState, useEffect, useCallback } from 'react';
import { isSubstantiallyDifferent, isSentenceComplete } from '../utils/speechRecognitionUtils';

interface UseSpeechRecognitionReturn {
  startListening: () => void; // Renamed from startHearing
  stopListening: () => void; // Renamed from stopHearing
}

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onInterimUpdate: (interimResult: string) => void // Add onInterimUpdate callback
): UseSpeechRecognitionReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false); // Track recognition state
  const [sentenceBuffer, setSentenceBuffer] = useState(''); // Track buffered interim results

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recog = new SpeechRecognitionConstructor();
      recog.continuous = true; // Keep listening for speech input continuously
      recog.interimResults = true; // Allow interim results to be captured
      recog.lang = 'en-US'; // Set the language to English

      recog.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim();
          const isFinal = event.results[i].isFinal;

          if (isFinal) {
            onResult(transcript, true); // Send the final result immediately
            setSentenceBuffer(''); // Reset sentence buffer on final result
          } else {
            interimText += transcript + ' ';
          }
        }

        interimText = interimText.trim();

        if (interimText && isSentenceComplete(interimText)) {
          onResult(interimText, false); // Send only complete sentences or clauses
          setSentenceBuffer(''); // Clear buffer when a complete sentence is formed
        } else {
          setSentenceBuffer(interimText); // Update sentence buffer
          if (isSubstantiallyDifferent(interimText, sentenceBuffer)) {
            onInterimUpdate(interimText); // Send interim updates to chatbots
          }
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsRecognizing(false); // Reset recognizing state on error
      };

      recog.onend = () => {
        console.log('Speech recognition ended.');
        setIsRecognizing(false); // Update state when recognition ends
      };

      setRecognition(recog); // Save the recognition instance
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, [onResult, onInterimUpdate]);

  const startListening = useCallback(() => {
    if (recognition && !isRecognizing) {
      try {
        recognition.start(); // Start speech recognition
        setIsRecognizing(true); // Track that recognition is active
        console.log('Speech recognition started.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [recognition, isRecognizing]);

  const stopListening = useCallback(() => {
    if (recognition && isRecognizing) {
      recognition.stop(); // Stop speech recognition
      setIsRecognizing(false); // Reset recognizing state
      console.log('Speech recognition stopped.');
    }
  }, [recognition, isRecognizing]);

  return { startListening, stopListening }; // Updated return object with new function names
};
