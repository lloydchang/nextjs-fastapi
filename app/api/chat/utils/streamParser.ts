// File: app/api/chat/utils/streamParser.ts

import logger from 'app/api/chat/utils/logger';

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
  let response = '';
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Regular expression to split on JSON object boundaries: }{ or }\n{ or similar cases
    let boundary = /}\s*{/.exec(buffer);
    while (boundary) {
      const boundaryIndex = boundary.index;
      
      // Extract complete JSON object up to the boundary and parse it
      const completeJson = buffer.slice(0, boundaryIndex + 1);
      buffer = buffer.slice(boundaryIndex + 1); // Remove parsed object from buffer

      try {
        const parsed = JSON.parse(completeJson);
        response += parsed.response || ''; // Accumulate response text
        done = parsed[doneSignal] || streamDone; // Check for done condition
      } catch (error) {
        logger.error(`Error parsing chunk at boundary: ${completeJson}`, error);
      }

      // Search for the next boundary in the remaining buffer
      boundary = /}\s*{/.exec(buffer);
    }
  }

  // Handle any remaining buffer content that wasn't split correctly
  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      response += parsed.response || '';
    } catch (error) {
      logger.error(`Error parsing remaining buffer: "${buffer}"`, error);
    }
  }

  return response.trim();
}
