// File: app/api/chat/controllers/AmazonBedrockTitanController.ts

import { NextResponse } from 'next/server';
import logger from '../utils/logger';
import { getConfig } from '../utils/config';

export async function handleTextWithAmazonBedrockTitanTextModel({ userPrompt, textModel }: { userPrompt: string; textModel: string }, config: any): Promise<string> {
  const { amazonBedrockTitanEndpoint } = getConfig(); // Get the Amazon Bedrock Titan endpoint from config

  // Debugging logs for endpoint and inputs
  logger.silly(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Loaded config: ${JSON.stringify(config)}`);
  logger.silly(`app/api/chat/controllers/AmazonBedrockTitanController.ts - AMAZON_BEDROCK_TITAN_ENDPOINT: ${amazonBedrockTitanEndpoint}`);
  logger.silly(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Text model provided: ${textModel}`);
  logger.silly(`app/api/chat/controllers/AmazonBedrockTitanController.ts - ${userPrompt}`);

  // Check if required environment variables are set
  if (!amazonBedrockTitanEndpoint || !textModel) {
    logger.error('app/api/chat/controllers/AmazonBedrockTitanController.ts - Missing required environment variables:');
    if (!amazonBedrockTitanEndpoint) {
      logger.error('Amazon Bedrock Titan endpoint is missing.');
    }
    if (!textModel) {
      logger.error('Text model is missing.');
    }
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const payload = { textModel, userPrompt };
  logger.silly(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Sending payload: ${JSON.stringify(payload)}`);

  // Sending request to the Amazon Bedrock Titan endpoint
  const response = await fetch(amazonBedrockTitanEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Check for HTTP errors
  if (!response.ok) {
    logger.error(`app/api/chat/controllers/AmazonBedrockTitanController.ts - HTTP error! status: ${response.status}`);
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const reader = response.body?.getReader();
  if (!reader) {
    logger.error('app/api/chat/controllers/AmazonBedrockTitanController.ts - Failed to access the response body stream.');
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

    logger.silly(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Received chunk: ${chunk}`);

    try {
      const parsed = JSON.parse(chunk);
      if (parsed.response) {
        buffer += parsed.response;

        // Check if buffer has a complete segment
        if (sentenceEndRegex.test(buffer)) {
          const completeSegment = buffer.trim();
          buffer = ''; // Clear buffer for next segment

          logger.verbose(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Incoming segment: ${completeSegment}`);
        }
      }
      done = parsed.done || streamDone;
    } catch (e) {
      logger.error('app/api/chat/controllers/AmazonBedrockTitanController.ts - Error parsing chunk:', chunk, e);
    }
  }

  // Return final buffer if there's remaining text
  logger.verbose(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Final response: ${buffer.trim()}`);
  return buffer.trim();
}
