// File: utils/tensorflowQnA.ts

import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';

let qna: any;
let modelPromise: Promise<any> | null = null;

/**
 * Load a script dynamically only if it hasn't been loaded yet.
 * @param url - The URL of the script to load.
 */
const loadScript = (url: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    console.debug(`utils/tensorflowQnA.ts - [TensorFlowQnA] Attempting to load script: ${url}`);

    if (document.querySelector(`script[src="${url}"]`)) {
      console.info(`utils/tensorflowQnA.ts - [TensorFlowQnA] Script already loaded: ${url}`);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true; // Ensure non-blocking load
    script.onload = () => {
      console.info(`utils/tensorflowQnA.ts - [TensorFlowQnA] Script loaded: ${url}`);
      resolve();
    };
    script.onerror = (err) => {
      console.error(`utils/tensorflowQnA.ts - Failed to load script: ${url}`, err);
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.body.appendChild(script);
  });
};

/**
 * Load TensorFlow.js and QnA model from CDN (client-side only).
 */
const loadQnAModel = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('TensorFlow can only be used in the browser.');
  }

  // Avoid redundant loads by caching the model
  if (modelPromise) return modelPromise;

  if (!qna) {
    try {
      console.info('utils/tensorflowQnA.ts - [TensorFlowQnA] Loading TensorFlow modules from CDN...');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/qna@latest');

      const tf = (window as any).tf;
      qna = (window as any).qna;

      console.info('utils/tensorflowQnA.ts - [TensorFlow] Initializing backend...');
      await tf.ready();
      console.info(`utils/tensorflowQnA.ts - [TensorFlow] Backend initialized: ${tf.getBackend()}`);
    } catch (error) {
      console.error('utils/tensorflowQnA.ts - [TensorFlow] Backend or module initialization failed:', error);
      throw new Error('Failed to initialize TensorFlow backend.');
    }
  }

  try {
    console.info('utils/tensorflowQnA.ts - [TensorFlowQnA] Loading QnA model...');
    modelPromise = qna.load();
    return await modelPromise;
  } catch (error) {
    console.error('utils/tensorflowQnA.ts - [TensorFlowQnA] Failed to load QnA model:', error);
    throw new Error('Failed to load QnA model.');
  }
};

/**
 * Process input using TensorFlow QnA and perform simultaneous API call.
 * @param input - User's question.
 * @param context - The conversation context or additional text.
 * @returns A promise that resolves to an array of bot messages.
 */
export const processLocalQnA = async (
  input: string,
  context: string
): Promise<Message[]> => {
  console.debug('utils/tensorflowQnA.ts - [TensorFlowQnA] processLocalQnA called with:', { input, context });

  try {
    const [tfResult, apiResult] = await Promise.allSettled([
      (async () => {
        const model = await loadQnAModel();
        console.debug('utils/tensorflowQnA.ts - [TensorFlowQnA] Model loaded. Running findAnswers...', {
          input,
          context,
        });
        return model.findAnswers(input, context);
      })(),
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, context }),
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
      }),
    ]);

    const messages: Message[] = [];

    if (tfResult.status === 'fulfilled') {
      console.debug('utils/tensorflowQnA.ts - [TensorFlowQnA] Answers received from TensorFlow:', tfResult.value);
      const tfMessages = tfResult.value.map((answer: any) => ({
        id: uuidv4(),
        sender: 'bot',
        text: answer.text,
        role: 'bot',
        content: answer.text,
        persona: 'tensorflow-qna',
        timestamp: Date.now(),
      }));
      messages.push(...tfMessages);
    }

    if (apiResult.status === 'fulfilled') {
      console.debug('utils/tensorflowQnA.ts - [API] Response received:', apiResult.value);
      const apiMessage: Message = {
        id: uuidv4(),
        sender: 'bot',
        text: apiResult.value.answer,
        role: 'bot',
        content: apiResult.value.answer,
        persona: 'api-bot',
        timestamp: Date.now(),
      };
      messages.push(apiMessage);
    }

    console.info('utils/tensorflowQnA.ts - [TensorFlowQnA] Process completed successfully.');
    return messages;
  } catch (error) {
    console.error('utils/tensorflowQnA.ts - [TensorFlowQnA] Error processing QnA or API:', error);
    throw new Error('Failed to process QnA or API response.');
  }
};
