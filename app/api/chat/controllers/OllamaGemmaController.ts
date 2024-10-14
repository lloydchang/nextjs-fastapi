// File: app/api/chat/controllers/OllamaGemmaController.ts

import { logger } from 'app/api/chat/utils/logger';
import { generateFromOllamaGemma } from 'app/api/chat/clients/OllamaGemmaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Ollama Gemma model.
 * @param params - Contains the user prompt and text model to be used.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithOllamaGemmaTextModel(params: { userPrompt: string; textModel: string; }): Promise<string> {
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
      userPrompt, // Correct parameter
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
