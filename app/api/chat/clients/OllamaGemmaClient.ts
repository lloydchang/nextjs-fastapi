// File: app/api/chat/clients/OllamaGemmaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import { logger } from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import { countTokens } from 'app/api/chat/utils/tokenizer';
import { managePrompt } from 'app/api/chat/utils/promptManager';

/**
 * Generates text using Ollama Gemma with effective prompt management.
 * @param params - Parameters for the request, including endpoint, userPrompt, and model.
 * @returns {Promise<string | null>} - The generated response or null in case of an error.
 */
export async function generateFromOllamaGemma(params: { endpoint: string; userPrompt: string; model: string; }): Promise<string | null> {
  const { endpoint, userPrompt, model } = params;

  // Define a single, structured prompt combining system and user prompts
  const structuredPrompt = `${systemPrompt}\n\nUser: ${userPrompt}`;
  const tokenCount = countTokens(structuredPrompt);
  logger.debug(`generateFromOllamaGemma - Structured prompt token count: ${tokenCount}`);

  try {
    const requestBody = JSON.stringify({ prompt: structuredPrompt, model });
    logger.debug(`generateFromOllamaGemma - Sending request: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    logger.debug(`generateFromOllamaGemma - Received response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`generateFromOllamaGemma - HTTP error! Status: ${response.status}. Response: ${errorText}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('generateFromOllamaGemma - Failed to access the response body stream.');
      return null;
    }

    const finalUserResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    logger.debug(`generateFromOllamaGemma - Generated response: ${finalUserResponse}`);
    return finalUserResponse;
  } catch (error) {
    logger.error(`generateFromOllamaGemma - Error sending request to Ollama Gemma: ${error}`);
    return null;
  }
}

/**
 * Summarizes a given text using Ollama Gemma.
 * Utilizes the same endpoint and model configurations.
 * @param endpoint - The Ollama Gemma API endpoint.
 * @param text - The text to summarize.
 * @param model - The model used for summarization.
 * @returns {Promise<string | null>} - The summarized text or null if failed.
 */
export async function summarizeText(endpoint: string, text: string, model: string): Promise<string | null> {
  const prompt = `Summarize the following conversation:\n\n${text}`;
  const tokenCount = countTokens(prompt);
  logger.debug(`summarizeText - Summarization prompt token count: ${tokenCount}`);

  try {
    const requestBody = JSON.stringify({ prompt, model });
    logger.debug(`summarizeText - Sending summarization request: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    logger.debug(`summarizeText - Received response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`summarizeText - HTTP error! Status: ${response.status}. Response: ${errorText}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('summarizeText - Failed to access the response body stream.');
      return null;
    }

    const summary = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    logger.debug(`summarizeText - Summarized text: ${summary}`);
    return summary;
  } catch (error) {
    logger.error(`summarizeText - Error: ${error}`);
    return null;
  }
}
