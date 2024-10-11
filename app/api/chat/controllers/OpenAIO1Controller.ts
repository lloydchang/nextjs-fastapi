// File: app/api/chat/controllers/OpenAIO1Controller.ts

import { NextResponse } from 'next/server';
import logger from '../utils/logger';
import { getConfig } from '../utils/config';

export async function handleTextWithOpenAIO1TextModel({ userPrompt, textModel }: { userPrompt: string; textModel: string }, config: any): Promise<string> {
  const { openAIO1Endpoint } = getConfig(); // Get the OpenAI O1 endpoint from config

  // Debugging logs for endpoint and inputs
  logger.silly(`app/api/chat/controllers/OpenAIO1Controller.ts - Loaded config: ${JSON.stringify(config)}`);
  logger.silly(`app/api/chat/controllers/OpenAIO1Controller.ts - OPENAI_O1_ENDPOINT: ${openAIO1Endpoint}`);
  logger.silly(`app/api/chat/controllers/OpenAIO1Controller.ts - Text model provided: ${textModel}`);
  logger.silly(`app/api/chat/controllers/OpenAIO1Controller.ts - ${userPrompt}`);

  // Check if required environment variables are set
  if (!openAIO1Endpoint || !textModel) {
    logger.error('app/api/chat/controllers/OpenAIO1Controller.ts - Missing required environment variables:');
    if (!openAIO1Endpoint) {
      logger.error('OpenAI O1 endpoint is missing.');
    }
    if (!textModel) {
      logger.error('Text model is missing.');
    }
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const payload = { textModel, userPrompt };
  logger.silly(`app/api/chat/controllers/OpenAIO1Controller.ts - Sending payload: ${JSON.stringify(payload)}`);

  // Sending request to the OpenAI O1 endpoint
  const response = await fetch(openAIO1Endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Check for HTTP errors
  if (!response.ok) {
    logger.error(`app/api/chat/controllers/OpenAIO1Controller.ts - HTTP error! status: ${response.status}`);
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const reader = response.body?.getReader();
  if (!reader) {
    logger.error('app/api/chat/controllers/OpenAIO1Controller.ts - Failed to access the response body stream.');
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

    logger.silly(`app/api/chat/controllers/OpenAIO1Controller.ts - Received chunk: ${chunk}`);

    try {
      const parsed = JSON.parse(chunk);
      if (parsed.response) {
        buffer += parsed.response;

        // Check if buffer has a complete segment
        if (sentenceEndRegex.test(buffer)) {
          const completeSegment = buffer.trim();
          buffer = ''; // Clear buffer for next segment

          logger.verbose(`app/api/chat/controllers/OpenAIO1Controller.ts - Incoming segment: ${completeSegment}`);
        }
      }
      done = parsed.done || streamDone;
    } catch (e) {
      logger.error('app/api/chat/controllers/OpenAIO1Controller.ts - Error parsing chunk:', chunk, e);
    }
  }

  // Return final buffer if there's remaining text
  logger.verbose(`app/api/chat/controllers/OpenAIO1Controller.ts - Final response: ${buffer.trim()}`);
  return buffer.trim();
}
