// File: app/api/chat/controllers/handleAzureOpenAIO1.ts

import { serveAzureOpenAIO1 } from '../clients/serveAzureOpenAIO1';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithAzureOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    logger.info(`app/api/chat/controllers/handleAzureOpenAIO1.ts - Handling text with AzureOpenAIO1. Prompt: ${prompt}, Model: ${model}`);
    const response = await serveAzureOpenAIO1(prompt, model, config);
    logger.info(`app/api/chat/controllers/handleAzureOpenAIO1.ts - AzureOpenAIO1 response: ${response}`);
    return response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/handleAzureOpenAIO1.ts - Error: ${error.message}`);
    throw error;
  }
}
