// File: app/api/chat/controllers/OpenAIController.ts

import { OpenAIClient } from '../clients/OpenAIClient';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    logger.info(`app/api/chat/controllers/OpenAIController.ts - Handling text with OpenAIO1. Prompt: ${prompt}, Model: ${model}`);
    const response = await OpenAIClient(prompt, model, config);
    logger.info(`app/api/chat/controllers/OpenAIController.ts - OpenAIO1 response: ${response}`);
    return response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/OpenAIController.ts - Error: ${error.message}`);
    throw error;
  }
}
