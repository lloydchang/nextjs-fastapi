// File: app/api/chat/clients/OllamaLlamaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/prompt';

/**
 * Generates a response from Ollama Llama model.
 * @param params - Parameters for the request, including endpoint, prompt, and model.
 * @returns {Promise<string | null>} - The generated response, or null in case of an error.
 */
export async function generateFromOllamaLlama(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;

  logger.silly(`OllamaLlamaClient.ts - Sending request to Ollama Llama. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.debug(`OllamaLlamaClient.ts - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`OllamaLlamaClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('OllamaLlamaClient.ts - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug(`OllamaLlamaClient.ts - Received final response from Ollama Llama: ${finalResponse}`);

    return finalResponse;
  } catch (error) {
    logger.warn(`OllamaLlamaClient.ts - Error generating content from Ollama Llama: ${error}`);
    return null;
  }
}
