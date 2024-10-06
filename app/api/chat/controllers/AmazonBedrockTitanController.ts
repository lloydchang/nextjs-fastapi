// File: app/api/chat/controllers/AmazonBedrockTitanController.ts

import fetch from 'node-fetch';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithAmazonBedrockTitan({ prompt, model }: HandlerInput, config: any): Promise<string> {
  const endpoint = config.AMAZON_BEDROCK_TITAN_ENDPOINT;

  if (!endpoint || !model) {
    throw new Error('Amazon Bedrock Titan: Required environment variables are missing.');
  }

  const payload = { model, prompt };
  logger.debug(`app/api/chat/controllers/AmazonBedrockTitanController.ts - Sending payload: ${JSON.stringify(payload)}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.AMAZON_BEDROCK_TITAN_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Amazon Bedrock Titan API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to access the response body stream.');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;
  const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    const chunk = decoder.decode(value, { stream: true });

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
