// File: app/api/chat/utils/request.ts

import { request } from 'undici';
import logger from './log';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export async function makeRequest(
  endpoint: string, 
  payload: object, 
  options: RequestOptions = {}
): Promise<any> {
  const { 
    method = 'POST', 
    headers = {}, 
    timeout = 30000, 
    retries = 3 
  } = options;

  logger.info(`Making ${method} request to ${endpoint}`);
  logger.info(`Request Payload: ${JSON.stringify(payload, null, 2)}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { body, statusCode, statusMessage } = await request(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
        bodyTimeout: timeout,
        headersTimeout: timeout,
      });

      logger.info(`Response Status: ${statusCode} ${statusMessage}`);
      const responseText = await body.text();
      logger.info(`Response Body: ${responseText}`);
      return responseText;
    } catch (error) {
      logger.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}