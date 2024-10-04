// File: app/api/chat/services/serveOllamaLlama.ts

import { validateEnvVars } from '../utils/validate';
import { streamResponseBody } from '../utils/stream';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt'; // Import systemPrompt

let hasWarnedOllamaLlama = false;

/**
 * Sends a POST request to the local Ollama Llama model endpoint and retrieves the streaming response.
 * @param params - Object containing the endpoint, prompt, and model.
 * @returns The generated text from the Ollama Llama model.
 */
export async function generateFromOllamaLlama(params: {
  endpoint: string;
  prompt: string;
  model: string;
}): Promise<string | null> {
  const optionalVars = ['OLLAMA_LLAMA_MODEL', 'OLLAMA_LLAMA_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);
  if (!isValid) {
    if (!hasWarnedOllamaLlama) {
      logger.warn(`Optional environment variables for Ollama Llama are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedOllamaLlama = true;
    }
    return null;
  }

  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.debug(`Sending request to Ollama Llama: Endpoint = ${endpoint}, Model = ${model}, Prompt = ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      logger.warn(`Ollama Llama Service responded with status: ${response.status} - ${response.statusText}`);
      return null;
    }

    const completeText = await streamResponseBody(response);
    logger.debug(`Generated Text from Ollama Llama: ${completeText.trim()}`);
    return completeText.trim();
  } catch (error) {
    logger.warn('Error generating content from Ollama Llama:', error);
    return null;
  }
}
