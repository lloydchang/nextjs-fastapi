// File: app/api/chat/utils/streamParser.ts

import logger from 'app/api/chat/utils/logger';

/**
 * Parses a readable stream and returns the accumulated result.
 * Supports both standard JSON streams and Server-Sent Events (SSE) streams.
 * @param reader - The ReadableStream reader to parse.
 * @param options - Optional parameters to customize parsing behavior.
 * @returns {Promise<string>} - A promise that resolves with the final parsed response.
 */
interface ParseStreamOptions {
  isSSE?: boolean;      // Flag to indicate if the stream uses SSE format
  doneSignal?: string;  // The key or value indicating the stream is done
}

export async function parseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: ParseStreamOptions = { isSSE: false, doneSignal: 'done' }
): Promise<string> {
  const { isSSE = false, doneSignal = 'done' } = options;
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let response = '';
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    if (isSSE) {
      // SSE parsing logic
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep the last partial message

      for (const message of messages) {
        if (message.startsWith('data: ')) {
          const data = message.replace(/^data: /, '').trim();

          if (data === '[DONE]') {
            done = true;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.response) {
              response += parsed.response;
            }
            if (parsed[doneSignal]) {
              done = true;
              break;
            }
          } catch (err) {
            logger.error(`app/api/chat/utils/streamParser.ts - Error parsing SSE message: "${data}"`, err);
          }
        }
      }
    } else {
      // Non-SSE parsing logic (e.g., chunked transfer encoding)
      // Split the buffer by JSON object boundaries: }{ or }\n{
      let boundary = /}\s*{/.exec(buffer);
      while (boundary) {
        const boundaryIndex = boundary.index;

        // Extract complete JSON object up to the boundary and parse it
        const completeJson = buffer.slice(0, boundaryIndex + 1);
        buffer = buffer.slice(boundaryIndex + 1); // Remove parsed object from buffer

        try {
          const parsed = JSON.parse(completeJson);
          response += parsed.response || ''; // Accumulate response text
          if (parsed[doneSignal] || false) {
            done = true; // Check for done condition based on the key
          }
        } catch (error) {
          logger.error(`app/api/chat/utils/streamParser.ts - Error parsing chunk at boundary: "${completeJson}"`, error);
        }

        // Search for the next boundary in the remaining buffer
        boundary = /}\s*{/.exec(buffer);
      }
    }
  }

  // Handle any remaining buffer content that wasn't split correctly
  if (buffer.trim()) {
    try {
      const trimmedBuffer = buffer.trim();
      if (isSSE && trimmedBuffer.startsWith('data: ')) {
        const data = trimmedBuffer.replace(/^data: /, '').trim();
        if (data !== '[DONE]') {
          const parsed = JSON.parse(data);
          response += parsed.response || '';
        }
      } else {
        const parsed = JSON.parse(buffer);
        response += parsed.response || '';
      }
    } catch (error) {
      logger.error(`app/api/chat/utils/streamParser.ts - Error parsing remaining buffer: "${buffer}"`, error);
    }
  }

  return response.trim();
}
