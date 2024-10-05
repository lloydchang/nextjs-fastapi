// File: app/api/chat/controllers/handleGoogleVertexGemini.ts

import fetch from 'node-fetch';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
  temperature: number;
}

export async function handleTextWithGoogleVertexGeminiModel(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model, temperature } = input;
  const endpoint = config.googleVertexGeminiEndpoint;

  logger.info(`app/api/chat/controllers/handleGoogleVertexGemini.ts - Handling text with Google Vertex Gemini. Model: ${model}, Prompt: ${prompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.googleVertexGeminiApiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Vertex Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info(`app/api/chat/controllers/handleGoogleVertexGemini.ts - Received response: ${JSON.stringify(data)}`);

    if (!data.response) {
      throw new Error('Google Vertex Gemini API did not return a "response" field.');
    }

    return data.response;
  } catch (error: any) {
    logger.error(`app/api/chat/controllers/handleGoogleVertexGemini.ts - Error: ${error.message}`);
    throw error;
  }
}
