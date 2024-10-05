// File: app/api/chat/clients/serveOllamaLlama.ts

import { validateEnvVars } from '../utils/validate';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt';

let hasWarnedOllamaLlama = false;

export async function generateFromOllamaLlama(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const optionalVars = ['OLLAMA_LLAMA_TEXT_MODEL', 'OLLAMA_LLAMA_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);

  if (!isValid) {
    if (!hasWarnedOllamaLlama) {
      logger.warn(`app/api/chat/clients/serveOllamaLlama.ts - Optional environment variables are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedOllamaLlama = true;
    }
    return null;
  }

  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.info(`app/api/chat/clients/serveOllamaLlama.ts - Sending request to Ollama Llama. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      logger.error(`app/api/chat/clients/serveOllamaLlama.ts - HTTP error! Status: ${response.status}`);
      const text = await response.text();
      logger.error(`app/api/chat/clients/serveOllamaLlama.ts - Response text: ${text}`);
      return null;
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

          if (sentenceEndRegex.test(buffer)) {
            const completeSegment = buffer.trim();
            buffer = '';
            logger.info(`app/api/chat/clients/serveOllamaLlama.ts - Processed segment: ${completeSegment}`);
          }
        }
        done = parsed.done || streamDone;
      } catch (e) {
        logger.error('app/api/chat/clients/serveOllamaLlama.ts - Error parsing chunk:', chunk, e);
      }
    }

    logger.info(`app/api/chat/clients/serveOllamaLlama.ts - Final response: ${buffer.trim()}`);
    return buffer.trim();
  } catch (error) {
    logger.warn(`app/api/chat/clients/serveOllamaLlama.ts - Error generating content from Ollama Llama: ${error}`);
    return null;
  }
}
