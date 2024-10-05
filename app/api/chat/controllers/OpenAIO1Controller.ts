// File: app/api/chat/controllers/OpenAIO1Controller.ts

import { OpenAIO1Client } from '../clients/OpenAIO1Client';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    logger.info(`app/api/chat/controllers/OpenAIO1Controller.ts - Handling text with OpenAIO1. Prompt: ${prompt}, Model: ${model}`);
    const response = await OpenAIO1Client(prompt, model, config);
    logger.info(`app/api/chat/controllers/OpenAIO1Controller.ts - OpenAIO1 response: ${response}`);
    return response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/OpenAIO1Controller.ts - Error: ${error.message}`);
    throw error;
  }
}
