// File: app/api/chat/clients/OllamaLlamaClient.ts

import logger from 'app/api/chat/utils/logger';
import { parseStream } from 'app/api/chat/utils/streamParser';
import { performIterativeRefinement } from 'app/api/chat/utils/iterativeRefinement';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import dotenv from 'dotenv';

dotenv.config();

interface GenerateFromOllamaLlamaParams {
  endpoint: string;
  prompt: string;
  model: string;
}

interface OllamaLlamaResponse {
  data: string;
  // Add other expected fields
}

/**
 * Utility function to safely extract error message
 * @param error - The error object of unknown type
 * @returns { string } - The error message or a stringified version of the error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Validates the input parameters for generateFromOllamaLlama
 * @param params - The parameters to validate
 */
function validateParams(params: GenerateFromOllamaLlamaParams) {
  const { endpoint, prompt, model } = params;
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint provided.');
  }
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt provided.');
  }
  if (!model || typeof model !== 'string') {
    throw new Error('Invalid model provided.');
  }
}

/**
 * Retrieves headers for the API request
 * @returns { Record<string, string> } - The headers object
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.API_TOKEN}`;
  }

  return headers;
}

/**
 * Function to generate a response from the Ollama Llama model, using iterative refinement to complete the response
 * @param params - Contains endpoint, prompt, and model
 * @returns { Promise<string | null> } - The complete response after all iterations of refinement
 */
export async function generateFromOllamaLlama(params: GenerateFromOllamaLlamaParams): Promise<string | null> {
  validateParams(params);
  const { endpoint, model, prompt } = params;

  // Define the function that generates a response from the AI model
  const generateResponseFn = async (combinedPrompt: string): Promise<string> => {
    const requestBody = JSON.stringify({ prompt: combinedPrompt, model });
    logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Request body: ${sanitizeRequestBody(requestBody)}`);

    const headers = getHeaders();

    // Create curl equivalent for the request
    const curlCommand = `curl -X POST "${endpoint}" -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d '${requestBody}'`;
    logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Curl command: ${curlCommand}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 seconds timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Log HTTP response details
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Response status: ${response.status}`);

      // Log response headers by iterating over them
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Response headers: ${JSON.stringify(headersObj)}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`app/api/chat/clients/OllamaLlamaClient.ts - HTTP error! Status: ${response.status}, Response: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        logger.error('app/api/chat/clients/OllamaLlamaClient.ts - Failed to access the response body stream.');
        throw new Error('Failed to access the response body stream.');
      }

      let finalResponse = await parseStream(reader, { isSSE: false, doneSignal: 'done' });
      logger.silly(`app/api/chat/clients/OllamaLlamaClient.ts - Received response from Ollama Llama: ${finalResponse}`);

      return finalResponse;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('app/api/chat/clients/OllamaLlamaClient.ts - Request timed out.');
      } else {
        logger.error(`app/api/chat/clients/OllamaLlamaClient.ts - Error during fetch: ${getErrorMessage(error)}`);
      }
      throw error;
    }
  };

  try {
    // Perform iterative refinement using the base system prompt (not the user prompt)
    const finalCompleteResponse = await performIterativeRefinement(systemPrompt, model, generateResponseFn);
    return finalCompleteResponse;
  } catch (error) {
    logger.error(`app/api/chat/clients/OllamaLlamaClient.ts - Iterative refinement failed: ${getErrorMessage(error)}`);
    return null;
  }
}

/**
 * Sanitizes the request body to remove sensitive information before logging.
 * @param body - The request body string
 * @returns { string } - The sanitized request body
 */
function sanitizeRequestBody(body: string): string {
  // Implement sanitization logic, e.g., remove API tokens or sensitive fields
  return body.replace(/"Authorization":\s*"Bearer\s[^"]+"/, '"Authorization": "Bearer [REDACTED]"');
}
