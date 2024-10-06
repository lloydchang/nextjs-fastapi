// File: app/api/chat/controllers/AzureOpenAIO1Controller.ts

import { NextResponse } from 'next/server';
import logger from '../utils/log';

export async function handleTextWithAzureOpenAIO1Model({ prompt, model }: { prompt: string; model: string }, config: any): Promise<string> {
  const { AZURE_OPENAI_O1_ENDPOINT } = process.env;

  if (!AZURE_OPENAI_O1_ENDPOINT || !model) {
    throw new Error('Azure OpenAI O1: Required environment variables are missing.');
  }

  const payload = { model, prompt };
  logger.debug(`app/api/chat/controllers/AzureOpenAIO1Controller.ts - Sending payload: ${JSON.stringify(payload)}`);

  const response = await fetch(AZURE_OPENAI_O1_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI O1: HTTP error! status: ${response.status}`);
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

          logger.verbose(`app/api/chat/controllers/AzureOpenAIO1Controller.ts - Incoming segment: ${completeSegment}`);
        }
      }
      done = parsed.done || streamDone;
    } catch (e) {
      logger.error('app/api/chat/controllers/AzureOpenAIO1Controller.ts - Error parsing chunk:', chunk, e);
    }
  }

  // Return final buffer if there's remaining text
  logger.verbose(`app/api/chat/controllers/AzureOpenAIO1Controller.ts - Final response: ${buffer.trim()}`);
  return buffer.trim();
}
