// File: app/api/chat/handlers/handleResponse.ts

import { NextResponse } from 'next/server';
import { AppConfig } from '../utils/config';
import { ResponseSegment } from '../types';

/**
 * Stream response with logs if enabled.
 * @param text - The text to be streamed as the response.
 * @param logs - An array of log messages to include in the response.
 * @param context - Context information for the response.
 * @param config - Application configuration settings.
 * @returns The streamed response.
 */
export function streamResponseWithLogs(text: string, logs: string[], context: string | null, config: AppConfig) {
  const segments = text.split(/(?<=[.!?])\s+/);

  const stream = new ReadableStream<ResponseSegment>({
    start(controller) {
      if (config.logsInResponse) {
        logs.forEach((log) => {
          const responseSegment: ResponseSegment = { message: `[Log]: ${log}`, context: context };
          controller.enqueue(JSON.stringify(responseSegment) + '\n');
        });
      }

      segments.forEach((segment) => {
        const message = segment.trim();
        if (message) {
          const responseSegment: ResponseSegment = { message: message, context: context };
          controller.enqueue(JSON.stringify(responseSegment) + '\n');
        }
      });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Send a complete response with logs if enabled.
 * @param text - The complete text to be sent in the response.
 * @param logs - An array of log messages to include in the response.
 * @param context - Context information for the response.
 * @param config - Application configuration settings.
 * @returns The complete JSON response.
 */
export function sendCompleteResponse(text: string, logs: string[], context: string | null, config: AppConfig) {
  const segments = text.split(/(?<=[.!?])\s+/);

  const responseSegments: ResponseSegment[] = [];

  if (config.logsInResponse) {
    logs.forEach((log) => {
      responseSegments.push({ message: `[Log]: ${log}`, context: context });
    });
  }

  segments.forEach((segment) => {
    const message = segment.trim();
    if (message) {
      responseSegments.push({ message: message, context: context });
    }
  });

  return new NextResponse(JSON.stringify(responseSegments), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
