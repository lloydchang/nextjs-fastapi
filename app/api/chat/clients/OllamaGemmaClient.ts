// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from '../utils/streamParser';
import logger from '../utils/logger';
import { systemPrompt } from '../utils/prompt';

/**
 * Fetches and parses a response from the Ollama Gemma model.
 * @param params - The request parameters, including endpoint, prompt, and model.
 * @returns The parsed response as a string, or null if an error occurs.
 */
export async function generateFromOllamaGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.verbose(`generateFromOllamaGemma - Sending request to Ollama Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      logger.error(`generateFromOllamaGemma - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('generateFromOllamaGemma - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug('generateFromOllamaGemma - Received final response from Ollama Gemma.');
    return finalResponse;

  } catch (error) {
    logger.warn(`generateFromOllamaGemma - Error generating content from Ollama Gemma: ${error}`);
    return null;
  }
}
