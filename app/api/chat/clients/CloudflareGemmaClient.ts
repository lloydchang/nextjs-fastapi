// File: app/api/chat/clients/CloudflareGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import { getConfig } from 'app/api/chat/utils/config';

/**
 * Function to interact with the Cloudflare Gemma API.
 * @param params - The parameters including endpoint, prompt, model, token, authEmail, and authKey.
 * @returns {Promise<string | null>} - The generated content or null if an error occurs.
 */
export async function generateFromCloudflareGemma(params: { endpoint: string; prompt: string; model: string; token: string; authEmail: string; authKey: string; }): Promise<string | null> {
  const { endpoint, prompt, model, token, authEmail, authKey } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;

  logger.silly(`generateFromCloudflareGemma - Sending request to Cloudflare Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  // Retrieve configuration for temperature and streaming
  const { stream = true, temperature = 0.0 } = getConfig();  // Default values for stream and temperature

  if (!authKey) {
    logger.error('generateFromCloudflareGemma - Cloudflare Gemma API key (authKey) is not defined.');
    return null;  // Or throw an error if appropriate
  }

  try {
    const requestBody = JSON.stringify({
      // frequency_penalty: 0.2,
      // image: [],
      // lora: model,
      // max_tokens: 256,
      // presence_penalty: 0.5,
      prompt: combinedPrompt,
      // raw: false,
      // repetition_penalty: 1.2,
      // seed: 12345,
      stream: stream,
      temperature: temperature,
      // top_k: 5,
      // top_p: 0.9,
    });

    logger.debug(`generateFromCloudflareGemma - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        // 'Authorization': `Bearer ${token}`, 
        'X-Auth-Email': authEmail,
        'X-Auth-Key': authKey,  // Use authKey from params
        'Content-Type': 'application/json'
      },
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
