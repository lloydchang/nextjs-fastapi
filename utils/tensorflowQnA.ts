// File: utils/tensorflowQnA.ts

import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { loadScript, createLogger } from './sharedUtils';

interface Answer {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

interface QnAModel {
  findAnswers(question: string, context: string): Promise<Answer[]>;
}

let qnaModel: QnAModel | null = null;
let modelPromise: Promise<QnAModel> | null = null;

const logger = createLogger('TensorFlowQnA');

/**
 * Initialize TensorFlow backend and load required modules
 */
const initializeTensorFlow = async (): Promise<void> => {
  try {
    logger.info('[TensorFlowQnA] Loading TensorFlow modules...');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/qna@latest');

    const tf = (window as any).tf;
    logger.info('[TensorFlow] Initializing backend...');
    await tf.ready();
    logger.info(`[TensorFlow] Backend initialized: ${tf.getBackend()}`);
  } catch (error) {
    logger.error('[TensorFlow] Initialization failed:', error);
    throw new Error('Failed to initialize TensorFlow backend.');
  }
};

/**
 * Load the QnA model with proper error handling and caching
 */
const loadQnAModel = async (): Promise<QnAModel> => {
  if (typeof window === 'undefined') {
    throw new Error('TensorFlow QnA can only be used in browser environments.');
  }

  if (qnaModel) return qnaModel;
  if (modelPromise) return modelPromise;

  try {
    await initializeTensorFlow();
    const qna = (window as any).qna;

    logger.info('[TensorFlowQnA] Loading QnA model...');
    modelPromise = qna.load().then((model: QnAModel) => {
      qnaModel = model;
      return model;
    });

    return modelPromise;
  } catch (error) {
    logger.error('[TensorFlowQnA] Model loading failed:', error);
    throw new Error('Failed to load QnA model.');
  }
};

/**
 * Process input text using TensorFlow QnA model
 */
export const processLocalQnA = async (
  input: string,
  context: string
): Promise<Message[]> => {
  logger.debug('[TensorFlowQnA] Processing input:', { input, context });

  try {
    const model = await loadQnAModel();
    const answers = await model.findAnswers(input, context);

    logger.debug('[TensorFlowQnA] TensorFlow answers:', answers);

    const messages: Message[] = answers
      .filter((answer: Answer) => answer.score > 0.5) // Filter low confidence answers
      .map((answer: Answer) => ({
        id: uuidv4(),
        sender: 'bot',
        text: answer.text,
        role: 'bot',
        content: answer.text,
        persona: 'tensorflow-qna',
        timestamp: Date.now(),
        confidence: answer.score,
        startIndex: answer.startIndex,
        endIndex: answer.endIndex
      }));

    return messages;
  } catch (error) {
    logger.error('[TensorFlowQnA] Error during processing:', error);
    throw new Error('Failed to process question using QnA model.');
  }
};

// Export additional utilities if needed
export const utils = {
  loadQnAModel,
  initializeTensorFlow
};
