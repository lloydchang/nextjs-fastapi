// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/prompt';

export async function generateFromOllamaGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;

  logger.silly(`OllamaGemmaClient.ts - Sending request to Ollama Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.debug(`OllamaGemmaClient.ts - Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`OllamaGemmaClient.ts - HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('OllamaGemmaClient.ts - Failed to access the response body stream.');
      return null;
    }

    const finalResponse = await parseStream(reader);
    logger.debug('OllamaGemmaClient.ts - Received final response from Ollama Gemma:');
    logger.debug(`OllamaGemmaClient.ts - Final response: ${finalResponse}`);
    
    return finalResponse;

  } catch (error) {
    logger.warn(`OllamaGemmaClient.ts - Error generating content from Ollama Gemma: ${error}`);
    return null;
  }
}
