// File: app/api/chat/controllers/OllamaGemmaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromOllamaGemma } from 'app/api/chat/clients/OllamaGemmaClient'; // Updated import
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
    logger.error('app/api/chat/controllers/OllamaGemmaController.ts - Missing required endpoint environment variable');
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
      logger.error('app/api/chat/controllers/OllamaGemmaController.ts - Failed to generate text from Ollama Gemma.');
      return '';
    }

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/OllamaGemmaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
