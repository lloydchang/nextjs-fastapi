// File: app/api/chat/clients/OllamaGemmaClient.ts

import { validateEnvVars } from '../utils/validate';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt';

let hasWarnedOllamaGemma = false;

export async function generateFromOllamaGemma(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const optionalVars = ['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);

  if (!isValid) {
    if (!hasWarnedOllamaGemma) {
      logger.warn(`app/api/chat/clients/OllamaGemmaClient.ts - Optional environment variables are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedOllamaGemma = true;
    }
    return null;
  }

  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.info(`app/api/chat/clients/OllamaGemmaClient.ts - Sending request to Ollama Gemma. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      logger.error(`app/api/chat/clients/OllamaGemmaClient.ts - HTTP error! Status: ${response.status}`);
      const text = await response.text();
      logger.error(`app/api/chat/clients/OllamaGemmaClient.ts - Response text: ${text}`);
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
            logger.info(`app/api/chat/clients/OllamaGemmaClient.ts - Processed segment: ${completeSegment}`);
          }
        }
        done = parsed.done || streamDone;
      } catch (e) {
        logger.error('app/api/chat/clients/OllamaGemmaClient.ts - Error parsing chunk:', chunk, e);
      }
    }

    logger.info(`app/api/chat/clients/OllamaGemmaClient.ts - Final response: ${buffer.trim()}`);
    return buffer.trim();
  } catch (error) {
    logger.warn(`app/api/chat/clients/OllamaGemmaClient.ts - Error generating content from Ollama Gemma: ${error}`);
    return null;
  }
}
