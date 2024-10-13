// File: app/api/chat/clients/OllamaLlamaClient.ts

import logger from 'app/api/chat/utils/logger';
import { parseStream } from 'app/api/chat/utils/streamParser';
import { performIterativeRefinement } from 'app/api/chat/utils/iterativeRefinement';

// Define the base system prompt
const systemPrompt = "Your base system prompt goes here.";

/**
 * Function to generate a response from the Ollama Llama model, using iterative refinement to complete the response
 * @param params - Contains endpoint, prompt, and model
 * @returns { Promise<string | null> } - The complete response after all iterations of refinement
 */
export async function generateFromOllamaLlama(params: { endpoint: string; prompt: string; model: string }): Promise<string | null> {
  const { endpoint, model } = params;

  // Define the function that generates a response from the AI model
  const generateResponseFn = async (combinedPrompt: string): Promise<string> => {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Request body: ${requestBody}`);

    const headers = { 'Content-Type': 'application/json' };
    
    // Create curl equivalent for the request
    const curlCommand = `curl -X POST "${endpoint}" -H "Content-Type: application/json" -d '${requestBody}'`;
    logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Curl command: ${curlCommand}`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      // Log HTTP response details
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Response status: ${response.status}`);

      // Log response headers by iterating over them
      const headersObj: Record<string, string> = {}; // Specify type to avoid TypeScript error
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Response headers: ${JSON.stringify(headersObj)}`);

      if (!response.ok) {
        logger.error(`app/api/chat/clients/OllamaLlamaClient.ts - HTTP error! Status: ${response.status}`);
        return '';
      }

      const reader = response.body?.getReader();
      if (!reader) {
        logger.error('app/api/chat/clients/OllamaLlamaClient.ts - Failed to access the response body stream.');
        return '';
      }

      let finalResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Received response from Ollama Llama: ${finalResponse}`);

      // Log the response body
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Response body: ${finalResponse}`);

      return finalResponse;

    } catch (error) {
      logger.error(`app/api/chat/clients/OllamaLlamaClient.ts - Error during fetch: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  };

  // Perform iterative refinement using the base system prompt (not the user prompt)
  const finalCompleteResponse = await performIterativeRefinement(systemPrompt, model, generateResponseFn);

  return finalCompleteResponse;
}
