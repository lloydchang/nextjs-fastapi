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

  // Corrected validation: ensure 'OLLAMA_GEMMA_ENDPOINT' is validated instead of 'OLLAMA_LLAMA_ENDPOINT'
  if (!validateEnvVars(['OLLAMA_GEMMA_ENDPOINT'])) {
    logger.warn('app/api/chat/controllers/OllamaGemmaController.ts - Missing required endpoint environment variable: OLLAMA_GEMMA_ENDPOINT');
    return '';
  }

  const endpoint = ollamaGemmaEndpoint as string;

  // logger.silly(`app/api/chat/controllers/OllamaGemmaController.ts - Generating text for model: ${textModel}`);
  // logger.silly(`app/api/chat/controllers/OllamaGemmaController.ts - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromOllamaGemma({
      endpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('app/api/chat/controllers/OllamaGemmaController.ts - Failed to generate text from Ollama Gemma.');
      return '';
    }

    // logger.silly(`app/api/chat/controllers/OllamaGemmaController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/OllamaGemmaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
