// File: app/api/chat/controllers/handleOpenAIO1.ts

import { serveOpenAIO1 } from '../clients/serveOpenAIO1';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    logger.info(`app/api/chat/controllers/handleOpenAIO1.ts - Handling text with OpenAIO1. Prompt: ${prompt}, Model: ${model}`);
    const response = await serveOpenAIO1(prompt, model, config);
    logger.info(`app/api/chat/controllers/handleOpenAIO1.ts - OpenAIO1 response: ${response}`);
    return response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/handleOpenAIO1.ts - Error: ${error.message}`);
    throw error;
  }
}
