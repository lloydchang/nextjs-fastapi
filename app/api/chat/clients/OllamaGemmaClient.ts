// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';

/**
 * Sends a request to Ollama Gemma with the system prompt.
 * @param params - Parameters for the request, including endpoint and model.
 * @returns {Promise<string | null>} - The system prompt response or null in case of an error.
 */
async function sendSystemPromptRequest(params: { endpoint: string; model: string; }): Promise<string | null> {
  const { endpoint, model } = params;

  try {
    const requestBody = JSON.stringify({ prompt: `System Prompt: ${systemPrompt}`, model });
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
      logger.error('app/api/chat/clients/OllamaGemmaClient.ts - Failed to access the response body stream for system prompt.');
      return null;
    }

    const finalSystemResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    return finalSystemResponse;
  } catch (error) {
    logger.error(`app/api/chat/clients/OllamaGemmaClient.ts - Error sending system prompt request to Ollama Gemma: ${error}`);
    return null;
  }
}

/**
 * Generates text using Ollama Gemma with the user prompt and system prompt combined.
 * @param params - Parameters for the request, including endpoint, userPrompt, and model.
 * @returns {Promise<string | null>} - The generated response or null in case of an error.
 */
export async function generateFromOllamaGemma(params: { endpoint: string; userPrompt: string; model: string; }): Promise<string | null> {
  const { endpoint, userPrompt, model } = params;
  const combinedPrompt = `System Prompt: ${systemPrompt}\n\nUser Prompt: ${userPrompt}`;

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
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
      logger.error('app/api/chat/clients/OllamaGemmaClient.ts - Failed to access the response body stream for user prompt.');
      return null;
    }

    const finalUserResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    return finalUserResponse;
  } catch (error) {
    logger.error(`app/api/chat/clients/OllamaGemmaClient.ts - Error sending user prompt request to Ollama Gemma: ${error}`);
    return null;
  }
}
