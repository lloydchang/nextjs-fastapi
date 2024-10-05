// File: app/api/chat/handlers/handleAzureOpenAIO1.ts

import { serveAzureOpenAIO1 } from '../services/serveAzureOpenAIO1';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithAzureOpenAIO1Model(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  try {
    const response = await serveAzureOpenAIO1(prompt, model, config);
    return response;
  } catch (error: any) {
    logger.error(`Error in handleAzureOpenAIO1Model: ${error.message}`);
    throw error;
  }
}
