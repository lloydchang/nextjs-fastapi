// File: app/api/chat/utils/promptBuilder.ts

import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import logger from 'app/api/chat/utils/logger';

/**
 * Build the prompt using the system prompt and user messages
 */
export function buildPrompt(messages: Array<{ role: string; content: string }>): string {
  const filteredContext = createFilteredContext(messages);
  return `${filteredContext}`;
}

/**
 * Create filtered context based on user messages without persona exceptions
 */
export function createFilteredContext(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map((msg) => {
      if (!msg.content) {
        logger.error(`app/api/chat/route.ts - Invalid message content: ${JSON.stringify(msg)}`);
        return ''; // Skip invalid messages
      }
      return msg.content;
    })
    .join('\n');  // Ensure the `join` is correctly aligned and closes the map.
}
