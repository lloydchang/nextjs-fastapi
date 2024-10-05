// File: app/api/chat/utils/stream.ts

import logger from './log';

export async function streamResponseBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    logger.error('app/api/chat/utils/stream.ts - Failed to access the response body stream.');
    throw new Error('Failed to access the response body stream.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !streamDone });
    done = streamDone;
  }

  logger.info(`app/api/chat/utils/stream.ts - Streamed response body: ${buffer}`);
  return buffer;
}
