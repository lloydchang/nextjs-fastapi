// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';

/**
 * Generates a response from the Ollama Gemma model.
 * @param params - Parameters for the request, including endpoint, prompt, and model.
 * @returns {Promise<string | null>} - The generated response, or null in case of an error.
 */
export async function generateFromOllamaGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${prompt}`;

  // logger.silly(`app/api/chat/clients/OllamaGemmaClient.ts - Sending request to Ollama Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    // logger.silly(`app/api/chat/clients/OllamaGemmaClient.ts - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`app/api/chat/clients/OllamaGemmaClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('app/api/chat/clients/OllamaGemmaClient.ts - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });

    if (finalResponse.trim().length === 0) {
      logger.warn('app/api/chat/clients/OllamaGemmaClient.ts - Received empty response from Ollama Gemma.');
      return null;
    }

    // logger.silly(`app/api/chat/clients/OllamaGemmaClient.ts - Received final response from Ollama Gemma: ${finalResponse}`);

    return finalResponse;
  } catch (error) {
    logger.error(`app/api/chat/clients/OllamaGemmaClient.ts - Error generating content from Ollama Gemma: ${error}`);
    return null;
  }
}
