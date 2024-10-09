// File: app/api/chat/clients/CloudflareLlamaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/prompt';

export async function generateFromCloudflareLlama(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;

  logger.silly(`generateFromCloudflareLlama - Sending request to Cloudflare Llama. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.debug(`generateFromCloudflareLlama - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`generateFromCloudflareLlama - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('generateFromCloudflareLlama - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug(`generateFromCloudflareLlama - Received final response from Cloudflare Llama: ${finalResponse}`);
    return finalResponse;
  } catch (error) {
    logger.warn(`generateFromCloudflareLlama - Error generating content from Cloudflare Llama: ${error}`);
    return null;
  }
}
