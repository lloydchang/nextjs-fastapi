// File: app/api/chat/controllers/OllamaLlamaController.ts

import { NextResponse } from 'next/server';
import logger from '../utils/logger';
import { getConfig } from '../utils/config';

export async function handleTextWithOllamaLlamaTextModel({ userPrompt, textModel }: { userPrompt: string; textModel: string }, config: any): Promise<string> {
  const { ollamaLlamaEndpoint } = getConfig(); // Get the Ollama Llama endpoint from config

  // Debugging logs for endpoint and inputs
  logger.debug(`app/api/chat/controllers/OllamaLlamaController.ts - Loaded config: ${JSON.stringify(config)}`);
  logger.debug(`app/api/chat/controllers/OllamaLlamaController.ts - OLLAMA_LLAMA_ENDPOINT: ${ollamaLlamaEndpoint}`);
  logger.debug(`app/api/chat/controllers/OllamaLlamaController.ts - Text model provided: ${textModel}`);
  logger.debug(`app/api/chat/controllers/OllamaLlamaController.ts - User prompt: ${userPrompt}`);

  // Check if required environment variables are set
  if (!ollamaLlamaEndpoint || !textModel) {
    logger.error('app/api/chat/controllers/OllamaLlamaController.ts - Missing required environment variables:');
    if (!ollamaLlamaEndpoint) {
      logger.error('Ollama Llama endpoint is missing.');
    }
    if (!textModel) {
      logger.error('Text model is missing.');
    }
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const payload = { textModel, userPrompt };
  logger.debug(`app/api/chat/controllers/OllamaLlamaController.ts - Sending payload: ${JSON.stringify(payload)}`);

  // Sending request to the Ollama Llama endpoint
  const response = await fetch(ollamaLlamaEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Check for HTTP errors
  if (!response.ok) {
    logger.error(`app/api/chat/controllers/OllamaLlamaController.ts - HTTP error! status: ${response.status}`);
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const reader = response.body?.getReader();
  if (!reader) {
    logger.error('app/api/chat/controllers/OllamaLlamaController.ts - Failed to access the response body stream.');
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;
  const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;

  // Reading the response stream
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    const chunk = decoder.decode(value, { stream: true });

    logger.debug(`app/api/chat/controllers/OllamaLlamaController.ts - Received chunk: ${chunk}`);

    try {
      const parsed = JSON.parse(chunk);
      if (parsed.response) {
        buffer += parsed.response;

        // Check if buffer has a complete segment
        if (sentenceEndRegex.test(buffer)) {
          const completeSegment = buffer.trim();
          buffer = ''; // Clear buffer for next segment

          logger.verbose(`app/api/chat/controllers/OllamaLlamaController.ts - Incoming segment: ${completeSegment}`);
        }
      }
      done = parsed.done || streamDone;
    } catch (e) {
      logger.error('app/api/chat/controllers/OllamaLlamaController.ts - Error parsing chunk:', chunk, e);
    }
  }

  // Return final buffer if there's remaining text
  logger.verbose(`app/api/chat/controllers/OllamaLlamaController.ts - Final response: ${buffer.trim()}`);
  return buffer.trim();
}
