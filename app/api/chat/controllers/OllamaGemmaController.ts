// File: app/api/chat/controllers/OllamaGemmaController.ts

import { logger } from '../utils/logger';
import { generateFromOllamaGemma } from '../clients/OllamaGemmaClient';
import { getConfig } from '../utils/config';
import { validateEnvVars } from '../utils/validate';

/**
 * Handles text generation using the Ollama Gemma model.
 * @param params - Contains the user prompt and text model to be used.
 * @param config - Configuration object.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithOllamaGemmaTextModel(
  params: { userPrompt: string; textModel: string; },
  config: any
): Promise<string> {
  const { userPrompt, textModel } = params;
  const { ollamaGemmaEndpoint } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['OLLAMA_GEMMA_ENDPOINT'])) {
    logger.error('OllamaGemmaController.ts - Missing required endpoint environment variable');
    return '';
  }

  const endpoint = ollamaGemmaEndpoint as string;

  try {
    const response = await generateFromOllamaGemma({
      endpoint,
      userPrompt: userPrompt, // Correct parameter
      model: textModel,
    });

    if (!response) {
      logger.error('OllamaGemmaController.ts - Failed to generate text from Ollama Gemma.');
      return '';
    }

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`OllamaGemmaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
