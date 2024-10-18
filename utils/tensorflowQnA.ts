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
    if (document.querySelector(`script[src="${url}"]`)) {
      console.info(`[TensorFlowQnA] Script already loaded: ${url}`);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.body.appendChild(script);
  });
};

/**
 * Load TensorFlow and QnA model from CDN (client-side only).
 */
const loadQnAModel = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('TensorFlow can only be used in the browser.');
  }

  if (!qna) {
    try {
      console.info('[TensorFlowQnA] Loading TensorFlow modules from CDN...');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/qna@latest');

      const tf = (window as any).tf;
      qna = (window as any).qna;

      console.info('[TensorFlow] Initializing backend...');
      await tf.ready();
      console.info(`[TensorFlow] Backend initialized: ${tf.getBackend()}`);
    } catch (error) {
      console.error('[TensorFlow] Backend or module initialization failed:', error);
      throw new Error('Failed to initialize TensorFlow backend.');
    }
  }

  if (!modelPromise) {
    console.info('[TensorFlowQnA] Loading QnA model...');
    modelPromise = qna.load();
  }

  return modelPromise;
};

/**
 * Process input using TensorFlow QnA and return bot messages.
 * @param input - User's question.
 * @param context - The conversation context or additional text.
 * @returns A promise that resolves to an array of bot messages.
 */
export const processLocalQnA = async (
  input: string,
  context: string
): Promise<Message[]> => {
  console.debug('[TensorFlow
