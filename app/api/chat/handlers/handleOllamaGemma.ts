import { NextResponse } from 'next/server';
import logger from '../utils/log';

export async function handleTextWithOllamaGemmaModel({ prompt, model }: { prompt: string, model: string }, config: any): Promise<string> {
  const { OLLAMA_GEMMA_ENDPOINT } = process.env;

  if (!OLLAMA_GEMMA_ENDPOINT || !model) {
    throw new Error('Ollama Gemma: Required environment variables are missing.');
  }

  const payload = { model, prompt };
  logger.info(`[Ollama Gemma Handler] Sending payload: ${JSON.stringify(payload)}`);

  const response = await fetch(OLLAMA_GEMMA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Ollama Gemma: HTTP error! status: ${response.status}`);
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

          logger.info(`[Ollama Gemma Handler] Processed segment: ${completeSegment}`);
        }
      }
      done = parsed.done || streamDone;
    } catch (e) {
      logger.error('Error parsing chunk:', chunk, e);
    }
  }

  // Return final buffer if there's remaining text
  return buffer.trim();
}
