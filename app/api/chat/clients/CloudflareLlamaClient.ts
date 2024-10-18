// File: app/api/chat/clients/CloudflareLlamaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import { getConfig } from 'app/api/chat/utils/config';

/**
 * Function to interact with the Cloudflare Llama API.
 * @param params - The parameters including endpoint, prompt, model, token (Bearer), xAuthEmail, and xAuthKey.
 * @returns {Promise<string | null>} - The generated content or null if an error occurs.
 */
export async function generateFromCloudflareLlama(params: {
  endpoint: string;
  prompt: string;
  model: string;
  token: string;
  xAuthEmail: string;
  xAuthKey: string;
}): Promise<string | null> {
  const { endpoint, prompt, model, token, xAuthEmail, xAuthKey } = params;
  const combinedPrompt = `${prompt}`;

  // Log the initiation of the request
  // logger.silly(`app/api/chat/clients/CloudflareLlamaClient.ts - Initiating request to Cloudflare Llama API at ${endpoint} with model ${model}`);

  // Retrieve configuration for temperature and streaming
  const { stream = true, temperature = 0.0 } = getConfig(); // Default values for stream and temperature

  if (!xAuthKey) {
    logger.error('app/api/chat/clients/CloudflareLlamaClient.ts - Cloudflare Llama API key (xAuthKey) is not defined.');
    return null; // Or throw an error if appropriate
  }

  try {
    const requestBody = JSON.stringify({
      prompt: combinedPrompt,
      stream: stream,
      temperature: temperature,
    });

    // Prepare request headers
    const requestHeaders = {
      Authorization: `Bearer ${token}`,
      'X-Auth-Email': xAuthEmail,
      'X-Auth-Key': xAuthKey,
      'Content-Type': 'application/json',
    };

    const maskedHeaders = {
      Authorization: `Bearer ${token.substring(0, 4)}***`,
      'X-Auth-Email': xAuthEmail ? `${xAuthEmail.substring(0, 3)}***@***.***` : '',
      'X-Auth-Key': xAuthKey ? `${xAuthKey.substring(0, 4)}***` : '',
      'Content-Type': 'application/json',
    };

    // Log the request headers and body at 'silly' level
    // logger.silly(`app/api/chat/clients/CloudflareLlamaClient.ts - Request Headers Sent: ${JSON.stringify(maskedHeaders, null, 2)}`);
    // logger.silly(`app/api/chat/clients/CloudflareLlamaClient.ts - Request Body Sent: ${requestBody}`);

    // Generate cURL equivalent using masked headers
    // const curlCommand = `curl -X POST "${endpoint}" \\
    //   -H "Authorization: ${maskedHeaders.Authorization}" \\
    //   -H "X-Auth-Email: ${maskedHeaders['X-Auth-Email']}" \\
    //   -H "X-Auth-Key: ${maskedHeaders['X-Auth-Key']}" \\
    //   -H "Content-Type: ${maskedHeaders['Content-Type']}" \\
    //   -d '${requestBody}'`;

    // logger.silly(`app/api/chat/clients/CloudflareLlamaClient.ts - cURL Equivalent:\n\n${curlCommand}`);

    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
    });

    // Log the response headers at 'silly' level
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    // logger.silly(`app/api/chat/clients/CloudflareLlamaClient.ts - Response Headers Received: ${JSON.stringify(responseHeaders, null, 2)}`);

    if (!response.ok) {
      logger.error(`app/api/chat/clients/CloudflareLlamaClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('app/api/chat/clients/CloudflareLlamaClient.ts - Failed to access the response body stream.');
      return null;
    }

    // logger.silly('app/api/chat/clients/CloudflareLlamaClient.ts - Processing response stream...');
    const finalResponse = await parseStream(reader, { isSSE: true, doneSignal: 'done' });

    // Log the response body at 'silly' level
    // logger.silly(`app/api/chat/clients/CloudflareLlamaClient.ts - Response Body Received: ${finalResponse}`);

    return finalResponse;
  } catch (error) {
    logger.warn(`app/api/chat/clients/CloudflareLlamaClient.ts - Error generating content from Cloudflare Llama: ${error}`);
    return null;
  }
}
