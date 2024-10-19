// File: utils/tensorflowQnA.ts

import { Message } from 'types';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Load a script dynamically only if it hasn't been loaded yet.
 */
const loadScript = (url: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        console.debug(`[TensorFlowQnA] Attempting to load script: ${url}`);

        if (document.querySelector(`script[src="${url}"]`)) {
            console.info(`[TensorFlowQnA] Script already loaded: ${url}`);
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
            console.info(`[TensorFlowQnA] Script loaded: ${url}`);
            resolve();
        };
        script.onerror = (err) => {
            console.error(`Failed to load script: ${url}`, err);
            reject(new Error(`Failed to load script: ${url}`));
        };
        document.body.appendChild(script);
    });
};

/**
 * Initialize TensorFlow backend and load required modules.
 */
const initializeTensorFlow = async (): Promise<void> => {
    try {
        console.info('[TensorFlowQnA] Loading TensorFlow modules...');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/qna@latest');

        const tf = (window as any).tf;
        console.info('[TensorFlow] Initializing backend...');
        await tf.ready();
        console.info(`[TensorFlow] Backend initialized: ${tf.getBackend()}`);
    } catch (error) {
        console.error('[TensorFlow] Initialization failed:', error);
        throw new Error('Failed to initialize TensorFlow backend.');
    }
};

/**
 * Load the QnA model with proper error handling and caching.
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

        console.info('[TensorFlowQnA] Loading QnA model...');
        modelPromise = qna.load().then((model: QnAModel) => {
            qnaModel = model;
            return model;
        });

        if (!modelPromise) {
            throw new Error('Failed to create model promise.');
        }
        return modelPromise;

    } catch (error) {
        console.error('[TensorFlowQnA] Model loading failed:', error);
        throw new Error('Failed to load QnA model.');
    }
};

/**
 * Exported utilities to ensure proper function initialization.
 */
export const utils = {
    loadQnAModel: async () => await loadQnAModel(),
    initializeTensorFlow: async () => await initializeTensorFlow()
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
        const [tfResult] = await Promise.allSettled([
            (async () => {
                const model = await loadQnAModel();
                console.debug('[TensorFlowQnA] Running model inference...', { input, context });
                return model.findAnswers(input, context);
            })(),
        ]);

        const messages: Message[] = [];

        if (tfResult.status === 'fulfilled') {
            console.debug('[TensorFlowQnA] TensorFlow answers:', tfResult.value);
            const tfMessages = tfResult.value
                .filter((answer: Answer) => answer.score > 0)
                .map((answer: Answer) => ({
                    id: uuidv4(),
                    sender: 'bot' as const,  // Ensure the type is correctly inferred
                    text: answer.text,
                    role: 'bot' as const,    // Ensure role matches allowed values
                    content: answer.text,
                    persona: 'tensorflow-qna',
                    timestamp: Date.now(),
                    confidence: answer.score,
                    startIndex: answer.startIndex,
                    endIndex: answer.endIndex
                }));
            messages.push(...tfMessages);
        } else {
            console.warn('[TensorFlowQnA] TensorFlow processing failed:', tfResult.reason);
        }

        console.info('[TensorFlowQnA] Processing completed successfully');
        return messages;
    } catch (error) {
        console.error('[TensorFlowQnA] Error during processing:', error);
        throw new Error('Failed to process question using QnA model.');
    }
};
