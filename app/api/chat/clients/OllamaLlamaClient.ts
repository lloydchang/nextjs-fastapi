// File: app/api/chat/clients/OllamaLlamaClient.ts

import { parseStream } from 'app/api/chat/utils/streamParser';
import logger from 'app/api/chat/utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import { performInternetSearch } from 'app/api/chat/utils/duckDuckGoSearch';

/**
 * Detects placeholders in the generated response. Placeholders are in the format [Placeholders].
 * @param response - The response string from the model.
 * @returns {string[]} - An array of detected placeholders.
 */
function detectPlaceholders(response: string): string[] {
  const placeholderPattern = /\[[^\]]*\]/g; // Matches text inside square brackets
  const placeholders = response.match(placeholderPattern);
  return placeholders || [];
}

/**
 * Replaces the placeholders in the response with the actual values obtained from the LLM summarization.
 * @param response - The response string with placeholders.
 * @param replacements - A map of placeholders to their replacement values.
 * @returns {string} - The updated response with the placeholders replaced.
 */
function replacePlaceholders(response: string, replacements: { [key: string]: string }): string {
  let updatedResponse = response;
  for (const [placeholder, value] of Object.entries(replacements)) {
    updatedResponse = updatedResponse.replace(placeholder, value || `Missing data for ${placeholder}`);
  }
  return updatedResponse;
}

/**
 * Asks the LLM to summarize a web search result into a concise word or phrase to replace the placeholder.
 * @param searchResult - The raw search result to summarize.
 * @param placeholder - The placeholder being replaced.
 * @param model - The LLM model to use for summarization.
 * @param endpoint - The endpoint for the LLM request.
 * @returns {Promise<string>} - The summarized phrase or word from the LLM.
 */
async function summarizeSearchResult(searchResult: string, placeholder: string, model: string, endpoint: string): Promise<string> {
  const summarizationPrompt = `
    Summarize the following search result in a concise phrase or word that can replace the placeholder ${placeholder}:
    
    ${searchResult}
  `;
  const requestBody = JSON.stringify({ prompt: summarizationPrompt, model });

  logger.silly(`Sending summarization request to LLM for placeholder: ${placeholder}. Request body: ${requestBody}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
  });

  if (!response.ok) {
    throw new Error(`Error summarizing search result: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to access the response body stream.');
  }

  const summary = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
  logger.silly(`Received summarized result for placeholder: ${placeholder}: ${summary.trim()}`);
  return summary.trim() || `Unable to summarize search for ${placeholder}`;
}

/**
 * Fetches real-time data for specific placeholders by searching the web using DuckDuckGo.
 * @param placeholders - The list of detected placeholders.
 * @param model - The LLM model used to summarize the search result.
 * @param endpoint - The endpoint for the LLM request.
 * @returns {Promise<{ [key: string]: string }>} - A map of placeholders to their replacement values.
 */
async function fetchPlaceholderData(placeholders: string[], model: string, endpoint: string): Promise<{ [key: string]: string }> {
  const data: { [key: string]: string } = {};

  for (const placeholder of placeholders) {
    // Remove the square brackets for the search query
    const searchQuery = placeholder.replace(/[\[\]]/g, '');

    logger.silly(`Initiating DuckDuckGo search for: ${searchQuery}`);

    const searchResults = await performInternetSearch(searchQuery); // Use DuckDuckGo search function

    if (searchResults.length === 0) {
      logger.warn(`No search results found for: ${searchQuery}`);
      data[placeholder] = `No results for ${searchQuery}`;
      continue;
    }

    logger.silly(`DuckDuckGo search results for ${searchQuery}: ${searchResults.join(', ')}`);

    // Ask the LLM to summarize the search result into a word or phrase
    const summarizedResult = await summarizeSearchResult(searchResults.join('\n'), placeholder, model, endpoint);
    data[placeholder] = summarizedResult;
  }

  return data;
}

/**
 * Generates a response from the Ollama Llama model, including resolving placeholders with real-time data if necessary.
 * @param params - Parameters for the request, including endpoint, prompt, and model.
 * @returns {Promise<string | null>} - The generated response, or null in case of an error.
 */
export async function generateFromOllamaLlama(params: { endpoint: string; prompt: string; model: string; }): Promise<string | null> {
  const { endpoint, prompt, model } = params;
  const combinedPrompt = `User Prompt: ${prompt}\n\nSystem Prompt:${systemPrompt}`;

  logger.silly(`Sending request to Ollama Llama. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.silly(`Request body: ${requestBody}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      logger.error(`HTTP error! Status: ${response.status}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('Failed to access the response body stream.');
      return null;
    }

    let finalResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
    logger.silly(`Received response from Ollama Llama: ${finalResponse}`);

    // Detect placeholders like [City Name], [population size], etc.
    const placeholders = detectPlaceholders(finalResponse);

    if (placeholders.length > 0) {
      logger.silly('Placeholders detected, performing internet search.');

      // Fetch data to replace placeholders using DuckDuckGo search and LLM summarization
      const placeholderData = await fetchPlaceholderData(placeholders, model, endpoint);

      // Replace placeholders in the response
      finalResponse = replacePlaceholders(finalResponse, placeholderData);
      logger.silly(`Updated response with placeholder data: ${finalResponse}`);
    }

    return finalResponse;
  } catch (error) {
    logger.error(`Error generating content from Ollama Llama: ${error}`);
    return null;
  }
}
