// File: app/api/chat/utils/request.ts

import { request } from 'undici'; // Remove HttpMethod from the import statement
import logger from './logger';

// Define the HttpMethod type to represent allowed HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

interface RequestOptions {
  method?: HttpMethod; // Use the custom HttpMethod type
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Makes a request to the specified endpoint with the given payload and options.
 * @param endpoint - The URL to send the request to.
 * @param payload - The request payload.
 * @param options - Optional configuration for the request.
 * @returns The response body as a string.
 */
export async function makeRequest(
  endpoint: string, 
  payload: object, 
  options: RequestOptions = {}
): Promise<any> {
  const { 
    method = 'POST', // Default to 'POST' method and TypeScript will infer the type correctly
    headers = {}, 
    timeout = 30000, 
    retries = 3 
  } = options;

  logger.info(`app/api/chat/utils/request.ts - Making ${method} request to ${endpoint}`);
  logger.info(`app/api/chat/utils/request.ts - Request Payload: ${JSON.stringify(payload, null, 2)}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { body, statusCode } = await request(endpoint, {
        method, // This will now be typed correctly
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
        bodyTimeout: timeout,
        headersTimeout: timeout,
      });

      logger.info(`app/api/chat/utils/request.ts - Response Status: ${statusCode}`);
      const responseText = await body.text();
      logger.info(`app/api/chat/utils/request.ts - Response Body: ${responseText}`);
      return responseText;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`app/api/chat/utils/request.ts - Attempt ${attempt} failed: ${error.message}`);
      } else {
        logger.error(`app/api/chat/utils/request.ts - Attempt ${attempt} failed with unknown error`);
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
