// File: app/api/chat/services/serveOllamaGemma.ts

import { validateEnvVars } from '../utils/validate';
import { streamResponseBody } from '../utils/stream';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt'; // Import systemPrompt

let hasWarnedOllamaGemma = false;

/**
 * Sends a POST request to the local Ollama Gemma model endpoint and retrieves the streaming response.
 * @param params - Object containing the endpoint, prompt, and model.
 * @returns The generated text from the Ollama Gemma model.
 */
export async function generateFromOllamaGemma(params: {
  endpoint: string;
  prompt: string;
  model: string;
}): Promise<string | null> {
  const optionalVars = ['OLLAMA_GEMMA_MODEL', 'OLLAMA_GEMMA_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);
  if (!isValid) {
    if (!hasWarnedOllamaGemma) {
      logger.warn(`Optional environment variables for Ollama Gemma are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedOllamaGemma = true;
    }
    return null;
  }

  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.debug(`Sending request to Ollama Gemma: Endpoint = ${endpoint}, Model = ${model}, Prompt = ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      logger.warn(`Ollama Gemma Service responded with status: ${response.status} - ${response.statusText}`);
      return null;
    }

    const completeText = await streamResponseBody(response);
    logger.debug(`Generated Text from Ollama Gemma: ${completeText.trim()}`);
    return completeText.trim();
  } catch (error) {
    logger.warn('Error generating content from Ollama Gemma:', error);
    return null;
  }
}
