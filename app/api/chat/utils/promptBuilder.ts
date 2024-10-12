// File: app/api/chat/utils/promptBuilder.ts

import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import logger from 'app/api/chat/utils/logger';

/**
 * Builds the prompt for the AI model based on the current context.
 * @param messages - Array of message objects representing the conversation history.
 * @returns {string} - The constructed prompt string.
 */
export function buildPrompt(messages: Array<{ role: string; content: string }>): string {
  const filteredContext = createFilteredContext(messages);
  return `${systemPrompt}\n${filteredContext}`;
}

/**
 * Creates a filtered context by extracting valid message contents.
 * Logs an error and skips any message without content.
 * @param messages - Array of message objects.
 * @returns {string} - Filtered and concatenated message contents.
 */
export function createFilteredContext(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map((msg) => {
      if (!msg.content) {
        logger.error(`app/api/chat/utils/promptBuilder.ts - Invalid message content: ${JSON.stringify(msg)}`);
        return ''; // Skip invalid messages
      }
      return msg.content;
    })
    .join('\n'); // Join messages with newline separators
}
