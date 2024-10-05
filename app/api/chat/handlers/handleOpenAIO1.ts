// File: app/api/chat/handlers/handleOpenAIO1.ts

import { serveOpenAIO1 } from '../services/serveOpenAIO1';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    const response = await serveOpenAIO1(prompt, model, config);
    return response;
  } catch (error: any) {
    logger.error(`Error in handleOpenAIO1Model: ${error.message}`);
    throw error;
  }
}
