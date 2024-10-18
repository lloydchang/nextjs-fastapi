// File: app/api/chat/utils/filterContext.ts

import logger from 'app/api/chat/utils/logger';
import { UserPrompt } from 'types';

/**
 * Filters the context for the AI model based on the current conversation history.
 * @param messages - Array of message objects representing the conversation history.
 * @returns {string} - The filtered context string.
 */
export function filterContext(messages: UserPrompt[]): string {
  const filteredContext = extractValidMessages(messages);
  return `${filteredContext}`;
}

/**
 * Extracts valid message contents by filtering out messages without content.
 * Logs an error and skips any message without valid content.
 * @param messages - Array of message objects.
 * @returns {string} - Filtered and concatenated message contents.
 */
export function extractValidMessages(
  messages: UserPrompt[]
): string {
  return messages
    .map((msg) => {
      if (!msg.content) {
        logger.error(`app/api/chat/utils/filterContext.ts - Invalid message content: ${JSON.stringify(msg)}`);
        return ''; // Skip invalid messages
      }
      return msg.content;
    })
    .join('\n'); // Join messages with newline separators
}
