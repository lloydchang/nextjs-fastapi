// File: app/api/chat/controllers/OllamaGemmaController.ts

import logger from '../utils/logger';
import { generateFromOllamaGemma } from '../clients/OllamaGemmaClient';
import { getConfig } from '../utils/config';
import { validateEnvVars } from '../utils/validate';

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

  if (!ollamaGemmaEndpoint) {
    logger.silly('handleTextWithOllamaGemmaTextModel - Missing Ollama Gemma endpoint.');
    return '';
  }

  logger.debug(`handleTextWithOllamaGemmaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithOllamaGemmaTextModel - User prompt: ${userPrompt}`);

  try {
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

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleTextWithOllamaGemmaTextModel - Error during text generation: ${errorMessage}`);
    return '';
  }
}
