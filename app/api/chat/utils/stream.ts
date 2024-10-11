// File: app/api/chat/utils/stream.ts

import jsesc from 'jsesc';
import logger from 'app/api/chat/utils/logger';

/**
 * Function to create a combined stream for responses
 */
export async function createCombinedStream(messages: Array<{ persona: string; message: string }>) {
  const encoder = new TextEncoder();
  const validMessages = messages.filter(({ message }) => message && message.trim() !== '');

  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of validMessages) {
          const formattedMessage = jsesc({ persona, message }, { json: true });
          controller.enqueue(encoder.encode(`data: ${formattedMessage}\n\n`));
          logger.silly(`app/api/chat/route.ts - Streaming message: ${formattedMessage}`);
        }
        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        logger.error(`app/api/chat/route.ts - Error in stream: ${errorMessage}`);
        controller.enqueue(encoder.encode(`data: {"error": "${errorMessage}"}\n\n`));
        controller.close();
      }
    },
  });
}
