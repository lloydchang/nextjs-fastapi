// File: app/api/chat/utils/streamParser.ts

import logger from './logger';

/**
 * Parses a readable stream and returns the accumulated result.
 * Handles cases where multiple JSON objects might be in the same chunk.
 * @param reader - The ReadableStream reader to parse.
 * @param doneSignal - The key in the parsed chunk that indicates the stream is done.
 * @returns A promise that resolves with the final parsed response.
 */
export async function parseStream(reader: ReadableStreamDefaultReader<Uint8Array>, doneSignal = 'done'): Promise<string> {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;
  let response = '';

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk; // Append the chunk to the buffer

    // Attempt to extract complete JSON objects
    let boundary = buffer.indexOf('}{');
    while (boundary !== -1) {
      // Split the buffer into two parts at the boundary
      const completeJson = buffer.slice(0, boundary + 1);
      buffer = buffer.slice(boundary + 1); // Keep the remaining buffer for next iteration

      try {
        const parsed = JSON.parse(completeJson);
        response += parsed.response || ''; // Accumulate the response
        done = parsed[doneSignal] || streamDone;
      } catch (error) {
        logger.error(`Error parsing chunk: ${completeJson}`, error);
      }

      boundary = buffer.indexOf('}{'); // Check if there are more boundaries
    }
  }

  // Handle any remaining buffer content
  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      response += parsed.response || '';
    } catch (error) {
      logger.error(`Error parsing remaining buffer: ${buffer}`, error);
    }
  }

  return response.trim();
}
