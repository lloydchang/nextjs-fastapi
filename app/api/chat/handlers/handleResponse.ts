// File: app/api/chat/handlers/handleResponse.ts

import { NextResponse } from 'next/server';
import { Config } from '../../../../utils/config';
import { ResponseSegment } from '../../../../types';

/**
 * Stream response with logs if enabled.
 */
export function streamResponseWithLogs(text: string, logs: string[], context: string | null, config: Config) {
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
 */
export function sendCompleteResponse(text: string, logs: string[], context: string | null, config: Config) {
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
