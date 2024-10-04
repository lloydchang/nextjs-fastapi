// File: app/api/chat/handlers/handleError.ts

import { NextResponse } from 'next/server';
import logger from '../utils/log';

/**
 * Streams an error message to the client and logs the error.
 * @param {string} errorMessage - The error message to be streamed.
 * @param {Array} logMessages - Array of log messages for debugging.
 * @param {any} config - Application configuration settings.
 * @returns {NextResponse} - The streamed error response.
 */
export function streamErrorMessage(errorMessage: string, logMessages: string[], config: any): NextResponse {
  logger.error(errorMessage);
  if (config.logsInResponse) {
    return NextResponse.json({ error: errorMessage, logs: logMessages }, { status: 429 });
  }
  return NextResponse.json({ error: errorMessage }, { status: 429 });
}

/**
 * Returns a complete error response.
 * @param {string} error - The error message to be returned.
 * @param {number} status - The HTTP status code.
 * @param {Array} logMessages - Array of log messages.
 * @param {any} config - Application configuration settings.
 * @returns {NextResponse} - The complete error response.
 */
export function returnErrorResponse(error: string, status: number, logMessages: string[], config: any): NextResponse {
  logger.error(error);
  if (config.logsInResponse) {
    return NextResponse.json({ error, logs: logMessages }, { status });
  }
  return NextResponse.json({ error }, { status });
}
