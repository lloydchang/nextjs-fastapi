// File: app/api/chat/controllers/OllamaGemmaController.ts

import { NextResponse } from 'next/server';
import logger from '../utils/logger';
import { getConfig } from '../utils/config';

export async function handleTextWithOllamaGemmaTextModel({ userPrompt, textModel }: { userPrompt: string; textModel: string }, config: any): Promise<string> {
  const { ollamaGemmaEndpoint } = getConfig(); // Get the Ollama Gemma endpoint from config

  // Debugging logs for endpoint and inputs
  logger.silly(`app/api/chat/controllers/OllamaGemmaController.ts - Loaded config: ${JSON.stringify(config)}`);
  logger.debug(`app/api/chat/controllers/OllamaGemmaController.ts - OLLAMA_GEMMA_ENDPOINT: ${ollamaGemmaEndpoint}`);
  logger.debug(`app/api/chat/controllers/OllamaGemmaController.ts - Text model provided: ${textModel}`);
  logger.debug(`app/api/chat/controllers/OllamaGemmaController.ts - User prompt: ${userPrompt}`);

  // Check if optional environment variables are set
  if (!ollamaGemmaEndpoint || !textModel) {
    logger.silly('app/api/chat/controllers/OllamaGemmaController.ts - Missing optional environment variables:');
    if (!ollamaGemmaEndpoint) {
      logger.silly('app/api/chat/controllers/OllamaGemmaController.ts - Ollama Gemma endpoint is missing.');
    }
    if (!textModel) {
      logger.silly('app/api/chat/controllers/OllamaGemmaController.ts - Ollama Gemma text model is missing.');
    }
    return;
  }

  // Adjust the payload structure to match API expectations
  const payload = {
    model: textModel, // Ensure this key matches the expected API field
    prompt: userPrompt.trim(), // Optionally trim whitespace for cleaner input
  };
  
  logger.debug(`app/api/chat/controllers/OllamaGemmaController.ts - Sending payload: ${JSON.stringify(payload)}`);

  // Sending request to the Ollama Gemma endpoint
  const response = await fetch(ollamaGemmaEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Check for HTTP errors
  if (!response.ok) {
    logger.error(`app/api/chat/controllers/OllamaGemmaController.ts - HTTP error! status: ${response.status}`);
    return;
  }

  // Initialize buffer and create a reader for the response body
  const reader = response.body?.getReader();
  if (!reader) {
    logger.error('app/api/chat/controllers/OllamaGemmaController.ts - Failed to access the response body stream.');
    return;
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = ''; // Initialize buffer
  let done = false;

  // Reading the response stream
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    const chunk = decoder.decode(value, { stream: true });

    logger.debug(`app/api/chat/controllers/OllamaGemmaController.ts - Received chunk: ${chunk}`);

    try {
      const parsed = JSON.parse(chunk); // Parse the chunk
      if (parsed.response) {
        buffer += parsed.response; // Accumulate the response text
        logger.verbose(`app/api/chat/controllers/OllamaGemmaController.ts - Incoming segment: ${parsed.response}`);
      }
      done = parsed.done || streamDone; // Check if done flag is set
    } catch (e) {
      logger.error('app/api/chat/controllers/OllamaGemmaController.ts - Error parsing chunk:', chunk, e);
    }
  }

  // Return final buffer if there's remaining text
  logger.verbose(`app/api/chat/controllers/OllamaGemmaController.ts - Final response: ${buffer.trim()}`);
  return buffer.trim();
}
