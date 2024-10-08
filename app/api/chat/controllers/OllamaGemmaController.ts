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
    logger.silly('handleTextWithOllamaGemmaTextModel - Missing required environment variables.');
    return '';
  }

  logger.debug(`handleTextWithOllamaGemmaTextModel - Generating text for model: ${textModel}`);
  
  // Log the user prompt and model details
  logger.debug(`handleTextWithOllamaGemmaTextModel - User prompt: ${userPrompt}`);
  
  const response = await generateFromOllamaGemma({
    endpoint: ollamaGemmaEndpoint,
    prompt: userPrompt,
    model: textModel,
  });

  if (!response) {
    logger.error('handleTextWithOllamaGemmaTextModel - Failed to generate text from Ollama Gemma.');
    return '';
  }

  logger.verbose(`handleTextWithOllamaGemmaTextModel - Generated response: ${response}`);
  return response;
}
