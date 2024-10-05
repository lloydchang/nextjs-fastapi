// File: app/api/chat/controllers/AzureOpenAIO1Controller.ts

import { AzureOpenAIO1Client } from '../clients/AzureOpenAIO1Client';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithAzureOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    logger.info(`app/api/chat/controllers/AzureOpenAIO1Controller.ts - Handling text with AzureOpenAIO1. Prompt: ${prompt}, Model: ${model}`);
    const response = await AzureOpenAIO1Client(prompt, model, config);
    logger.info(`app/api/chat/controllers/AzureOpenAIO1Controller.ts - AzureOpenAIO1 response: ${response}`);
    return response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/AzureOpenAIO1Controller.ts - Error: ${error.message}`);
    throw error;
  }
}
