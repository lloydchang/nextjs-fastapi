// File: app/api/chat/handlers/handleErrors.ts

import { NextResponse } from 'next/server';
import { Config } from '../../../utils/config';
import { ResponseSegment } from '../../../types';

/**
 * Return a stream error message along with logs if enabled.
 */
export function streamErrorMessage(error: string, logs: string[], config: Config) {
  const stream = new ReadableStream<ResponseSegment>({
    start(controller) {
      const errorSegment: ResponseSegment = { message: `Error: ${error}`, context: null };
      controller.enqueue(JSON.stringify(errorSegment) + '\n');

      if (config.logsInResponse) {
        logs.forEach((log) => {
          const logSegment: ResponseSegment = { message: `[Log]: ${log}`, context: null };
          controller.enqueue(JSON.stringify(logSegment) + '\n');
        });
      }

      controller.close();
    },
  });

  return new NextResponse(stream, {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Returns a standard JSON error response.
 */
export function returnErrorResponse(error: string, status: number, logs: string[], config: Config) {
  const responseSegments: ResponseSegment[] = [
    { message: `Error: ${error}`, context: null }
  ];

  if (config.logsInResponse) {
    logs.forEach((log) => {
      responseSegments.push({ message: `[Log]: ${log}`, context: null });
    });
  }

  return new NextResponse(JSON.stringify(responseSegments), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
