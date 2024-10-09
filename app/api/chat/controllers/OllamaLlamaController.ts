// File: app/api/chat/controllers/OllamaLlamaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromOllamaLlama } from 'app/api/chat/clients/OllamaLlamaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Ollama Llama model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithOllamaLlamaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { ollamaLlamaEndpoint } = getConfig();

  if (!validateEnvVars(['OLLAMA_LLAMA_ENDPOINT'])) {
    logger.silly('handleTextWithOllamaLlamaTextModel - Missing required environment variables.');
    return '';
  }

  const endpoint = ollamaLlamaEndpoint as string;

  logger.debug(`handleTextWithOllamaLlamaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithOllamaLlamaTextModel - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromOllamaLlama({ endpoint, prompt: userPrompt, model: textModel });

    if (!response) {
      logger.error('handleTextWithOllamaLlamaTextModel - Failed to generate text from Ollama Llama.');
      return '';
    }

    logger.verbose(`handleTextWithOllamaLlamaTextModel - Generated response: ${response}`);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleTextWithOllamaLlamaTextModel - Error during text generation: ${errorMessage}`);
    return '';
  }
}
