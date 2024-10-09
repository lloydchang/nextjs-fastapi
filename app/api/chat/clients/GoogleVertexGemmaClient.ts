// File: app/api/chat/clients/GoogleVertexGemmaClient.ts

import logger from '../utils/logger';

export async function generateFromGoogleVertexGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;

  logger.silly(`generateFromGoogleVertexGemma - Sending request to Google Vertex Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${prompt}`);

  try {
    const requestBody = JSON.stringify({
      instances: [{ content: prompt }],
      parameters: { temperature: 0.0 },
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
      },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`generateFromGoogleVertexGemma - HTTP error! Status: ${response.status}`);
      return null;
    }

    const responseData = await response.json();
    const finalResponse = responseData?.predictions?.[0]?.content ?? null;

    logger.debug(`generateFromGoogleVertexGemma - Received response: ${finalResponse}`);
    return finalResponse;
  } catch (error) {
    logger.warn(`generateFromGoogleVertexGemma - Error generating content from Google Vertex Gemma: ${error}`);
    return null;
  }
}
