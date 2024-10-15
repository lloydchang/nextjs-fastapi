// File: app/api/chat/clients/GoogleVertexGeminiClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';

export async function generateFromGoogleVertexGemini(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${prompt}`;

  logger.silly(`app/api/chat/clients/GoogleVertexGeminiClient.ts - Sending request to GoogleVertex Gemini. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.silly(`app/api/chat/clients/GoogleVertexGeminiClient.ts - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`app/api/chat/clients/GoogleVertexGeminiClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('app/api/chat/clients/GoogleVertexGeminiClient.ts - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.silly(`app/api/chat/clients/GoogleVertexGeminiClient.ts - Received final response from GoogleVertex Gemini: ${finalResponse}`);
    
    return finalResponse;

  } catch (error) {
    logger.warn(`app/api/chat/clients/GoogleVertexGeminiClient.ts - Error generating content from GoogleVertex Gemini: ${error}`);
    return null;
  }
}
