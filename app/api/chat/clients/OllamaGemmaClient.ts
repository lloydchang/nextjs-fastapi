// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';

/**
 * Generates text using Ollama Gemma with structured messages.
 * @param params - Parameters for the request, including endpoint, messages, and model.
 * @returns {Promise<string | null>} - The generated response or null in case of an error.
 */
export async function generateFromOllamaGemma(params: { endpoint: string; messages: { role: string; content: string; }[]; model: string; }): Promise<string | null> {
  const { endpoint, messages, model } = params;

  try {
    const requestBody = JSON.stringify({ messages, model });
    logger.debug(`OllamaGemmaClient.ts - Sending request to Ollama Gemma: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    logger.debug(`OllamaGemmaClient.ts - Received response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`OllamaGemmaClient.ts - HTTP error! Status: ${response.status}. Response: ${errorText}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('OllamaGemmaClient.ts - Failed to access the response body stream.');
      return null;
    }

    const finalUserResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    logger.debug(`OllamaGemmaClient.ts - Generated response: ${finalUserResponse}`);
    return finalUserResponse;
  } catch (error) {
    logger.error(`OllamaGemmaClient.ts - Error sending request to Ollama Gemma: ${error}`);
    return null;
  }
}
