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
 * Load TensorFlow and QnA model from CDN.
 */
const loadQnAModel = async (): Promise<any> => {
  if (!qna) {
    try {
      console.info('[TensorFlowQnA] Loading TensorFlow modules from CDN...');
      
      // Load TensorFlow and QnA from CDN
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/qna@latest');
      
      const tf = (window as any).tf;
      qna = (window as any).qna;

      console.info('[TensorFlow] Initializing backend...');
      if (!tf.getBackend()) {
        await tf.ready();
        console.info(`[TensorFlow] Backend initialized: ${tf.getBackend()}`);
      } else {
        console.info(`[TensorFlow] Backend already initialized: ${tf.getBackend()}`);
      }
    } catch (error) {
      console.error('[TensorFlow] Backend or module initialization failed:', error);
      throw new Error('Failed to initialize TensorFlow backend.');
    }
  }

  if (!modelPromise) {
    try {
      console.info('[TensorFlowQnA] Loading QnA model...');
      modelPromise = qna.load();
    } catch (error) {
      console.error('[TensorFlowQnA] Failed to load QnA model:', error);
      throw new Error('Failed to load QnA model.');
    }
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
  console.debug('[TensorFlowQnA] processLocalQnA called with:', { input, context });

  try {
    const model = await loadQnAModel();
    console.debug('[TensorFlowQnA] Model loaded. Running findAnswers...', {
      input,
      context,
    });

    const answers = await model.findAnswers(input, context);
    console.debug('[TensorFlowQnA] Answers received:', answers);

    const botMessages: Message[] = answers.map((answer) => ({
      id: uuidv4(),
      sender: 'bot',
      text: answer.text,
      role: 'bot',
      content: answer.text,
      persona: 'tensorflow-qna',
      timestamp: Date.now(),
    }));

    console.info('[TensorFlowQnA] Process completed successfully.');
    return botMessages;
  } catch (error) {
    console.error('[TensorFlowQnA] Error processing QnA:', error);
    throw new Error('Failed to process local QnA.');
  }
};
