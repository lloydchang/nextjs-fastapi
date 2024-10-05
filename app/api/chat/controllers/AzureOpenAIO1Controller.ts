// File: app/api/chat/controllers/AzureOpenAIController.ts

import { AzureOpenAIClient } from '../clients/AzureOpenAIClient';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithAzureOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    logger.info(`app/api/chat/controllers/AzureOpenAIController.ts - Handling text with AzureOpenAIO1. Prompt: ${prompt}, Model: ${model}`);
    const response = await AzureOpenAIClient(prompt, model, config);
    logger.info(`app/api/chat/controllers/AzureOpenAIController.ts - AzureOpenAIO1 response: ${response}`);
    return response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/AzureOpenAIController.ts - Error: ${error.message}`);
    throw error;
  }
}
