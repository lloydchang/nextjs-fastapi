// File: app/api/chat/controllers/OllamaGemmaController.ts

import logger from '../utils/logger';
import { generateFromOllamaGemma } from '../clients/OllamaGemmaClient';
import { getConfig } from '../utils/config';

/**
 * Handles text generation using the Ollama Gemma text model.
 * @param params - The user prompt and text model name.
 * @param config - The configuration object.
 * @returns The generated response from the Ollama Gemma model.
 */
export async function handleTextWithOllamaGemmaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { ollamaGemmaEndpoint } = getConfig();

  if (!ollamaGemmaEndpoint || !textModel) {
    logger.silly('Missing required environment variables.');
    return '';
  }

  const response = await generateFromOllamaGemma({
    endpoint: ollamaGemmaEndpoint,
    prompt: userPrompt,
    model: textModel,
  });

  if (!response) {
    logger.error('Failed to generate text from Ollama Gemma.');
    return '';
  }

  logger.verbose(`Generated response: ${response}`);
  return response;
}
