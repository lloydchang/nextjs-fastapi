// File: app/api/chat/clients/GoogleVertexGemmaClient.ts

import { parseStream } from '../utils/streamParser';
import logger from '../utils/logger';
import { systemPrompt } from '../utils/prompt';

export async function generateFromGoogleVertexGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;

  logger.silly(`generateFromGoogleVertexGemma - Sending request to GoogleVertex Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.debug(`generateFromGoogleVertexGemma - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`generateFromGoogleVertexGemma - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('generateFromGoogleVertexGemma - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug('generateFromGoogleVertexGemma - Received final response from GoogleVertex Gemma:');
    logger.debug(`generateFromGoogleVertexGemma - Final response: ${finalResponse}`);
    
    return finalResponse;

  } catch (error) {
    logger.warn(`generateFromGoogleVertexGemma - Error generating content from GoogleVertex Gemma: ${error}`);
    return null;
  }
}
