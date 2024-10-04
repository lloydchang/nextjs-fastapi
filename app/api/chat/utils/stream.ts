// File: app/api/chat/utils/stream.ts

import { Readable } from 'stream';

/**
 * Helper function to stream the response body and accumulate the text.
 * @param body - The body stream from the response.
 * @returns The complete text from the streamed response.
 */
export async function streamResponseBody(body: Readable): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let completeText = '';
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    console.log('Read chunk:', value); // Debugging log

    if (done) {
      console.log('Stream reading completed.'); // Debugging log
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Split buffer by newline to get individual JSON lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line for the next chunk

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.response) {
            completeText += parsed.response; // Accumulate the response text
          }
        } catch (parseError) {
          console.error('Error parsing JSON chunk:', line, parseError);
        }
      }
    }
  }

  // Handle any remaining content in the buffer
  if (buffer.trim()) {
    try {
      const remainingParsed = JSON.parse(buffer.trim());
      if (remainingParsed.response) {
        completeText += remainingParsed.response;
      }
    } catch (finalParseError) {
      console.error('Error parsing remaining JSON chunk:', buffer, finalParseError);
    }
  }

  return completeText;
}
