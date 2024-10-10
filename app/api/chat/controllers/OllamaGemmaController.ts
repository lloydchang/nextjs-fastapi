// File: app/api/chat/controllers/OllamaGemmaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromOllamaGemma } from 'app/api/chat/clients/OllamaGemmaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Ollama Gemma model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithOllamaGemmaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { ollamaGemmaEndpoint } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['OLLAMA_GEMMA_ENDPOINT'])) {
    logger.silly('OllamaGemmaController.ts - Missing required environment variables.');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = ollamaGemmaEndpoint as string;

  logger.debug(`OllamaGemmaController.ts - Generating text for model: ${textModel}`);
  logger.silly(`OllamaGemmaController.ts - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromOllamaGemma({
      endpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('OllamaGemmaController.ts - Failed to generate text from Ollama Gemma.');
      return '';
    }

    logger.verbose(`OllamaGemmaController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`OllamaGemmaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
