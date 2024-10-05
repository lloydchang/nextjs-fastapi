// File: app/api/chat/handlers/handleOllamaLlama.ts

import fetch from 'node-fetch';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithOllamaLlamaModel(input: HandlerInput, config: any): Promise<string | Response> {
  const { prompt, model } = input;
  const endpoint = config.ollamaLlamaEndpoint;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama Llama API error: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info(`Ollama Llama raw response: ${JSON.stringify(data)}`);

    if (!data.response) {
      throw new Error('Ollama Llama API did not return a "response" field.');
    }

    return data.response;
  } catch (error: any) {
    logger.error(`Error in handleOllamaLlamaModel: ${error.message}`);
    throw error;
  }
}
