// File: app/api/chat/controllers/OllamaGemmaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromOllamaGemma } from 'app/api/chat/clients/OllamaGemmaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Ollama Gemma model with structured messages.
 * @param params - Contains the messages array and text model to be used.
 * @param config - Configuration object.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithOllamaGemmaTextModel(
  params: { messages: { role: string; content: string; }[]; model: string; },
  config: any
): Promise<string> {
  const { messages, model } = params;
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
      messages,
      model,
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
