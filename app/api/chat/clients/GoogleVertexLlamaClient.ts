// File: app/api/chat/clients/GoogleVertexLlamaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';

export async function generateFromGoogleVertexLlama(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${prompt}`;

  logger.silly(`generateFromGoogleVertexLlama - Sending request to Google Vertex Llama. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.debug(`generateFromGoogleVertexLlama - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`generateFromGoogleVertexLlama - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('generateFromGoogleVertexLlama - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug(`generateFromGoogleVertexLlama - Received final response from Google Vertex Llama: ${finalResponse}`);
    return finalResponse;
  } catch (error) {
    logger.warn(`generateFromGoogleVertexLlama - Error generating content from Google Vertex Llama: ${error}`);
    return null;
  }
}
