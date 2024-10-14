// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';

/**
 * Generates text using Ollama Gemma with the system and user prompts clearly defined.
 * @param params - Parameters for the request, including endpoint, userPrompt, and model.
 * @returns {Promise<string | null>} - The generated response or null in case of an error.
 */
export async function generateFromOllamaGemma(params: { endpoint: string; userPrompt: string; model: string; }): Promise<string | null> {
  const { endpoint, userPrompt, model } = params;

  // Define first system prompt last user prompt
  const firstSystemLastUserPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

  try {
    const requestBody = JSON.stringify({ prompt: firstSystemLastUserPrompt, model });
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`OllamaGemmaClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('OllamaGemmaClient.ts - Failed to access the response body stream for user prompt.');
      return null;
    }

    const finalUserResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    return finalUserResponse;
  } catch (error) {
    logger.error(`OllamaGemmaClient.ts - Error sending user prompt request to Ollama Gemma: ${error}`);
    return null;
  }

  // Define first user last system prompt
  const firstUserLastSystemPrompt = `User: ${userPrompt}\n\nSystem: ${systemPrompt}`;

  try {
    const requestBody = JSON.stringify({ prompt: firstUserLastSystemPrompt, model });
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`OllamaGemmaClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('OllamaGemmaClient.ts - Failed to access the response body stream for user prompt.');
      return null;
    }

    const finalUserResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    return finalUserResponse;
  } catch (error) {
    logger.error(`OllamaGemmaClient.ts - Error sending user prompt request to Ollama Gemma: ${error}`);
    return null;
  }
}
