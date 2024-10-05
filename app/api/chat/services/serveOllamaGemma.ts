// File: app/api/chat/services/serveOllamaGemma.ts

import { validateEnvVars } from '../utils/validate';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt';

let hasWarnedOllamaGemma = false;

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
    // Send the request using the same logic as in the test script
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    // Check for HTTP errors
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      console.error('Response text:', text);
      return null;
    }

    // Retrieve the response as text
    const completeText = await response.text();
    logger.debug(`Generated Text from Ollama Gemma: ${completeText.trim()}`);
    return completeText.trim(); // Return the trimmed response text
  } catch (error) {
    logger.warn('Error generating content from Ollama Gemma:', error);
    return null;
  }
}
