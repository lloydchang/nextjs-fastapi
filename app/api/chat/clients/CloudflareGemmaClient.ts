// File: app/api/chat/clients/CloudflareGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/prompt';

export async function generateFromCloudflareGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;

  logger.silly(`generateFromCloudflareGemma - Sending request to Cloudflare Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.debug(`generateFromCloudflareGemma - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`generateFromCloudflareGemma - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('generateFromCloudflareGemma - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug('generateFromCloudflareGemma - Received final response from Cloudflare Gemma:');
    logger.debug(`generateFromCloudflareGemma - Final response: ${finalResponse}`);
    
    return finalResponse;

  } catch (error) {
    logger.warn(`generateFromCloudflareGemma - Error generating content from Cloudflare Gemma: ${error}`);
    return null;
  }
}
