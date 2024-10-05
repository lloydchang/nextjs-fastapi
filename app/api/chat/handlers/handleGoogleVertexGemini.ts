// File: app/api/chat/handlers/handleGoogleVertexGemini.ts

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

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.googleVertexGeminiApiKey}`, // Assuming API key is required
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
    logger.info(`Google Vertex Gemini raw response: ${JSON.stringify(data)}`);

    if (!data.response) {
      throw new Error('Google Vertex Gemini API did not return a "response" field.');
    }

    return data.response;
  } catch (error: any) {
    logger.error(`Error in handleGoogleVertexGeminiModel: ${error.message}`);
    throw error;
  }
}
