// File: app/api/chat/utils/filterContext.ts

import logger from 'app/api/chat/utils/logger';
import { UserPrompt } from 'types';

/**
 * Extracts valid messages by filtering out messages without content.
 * Logs an error for each invalid message.
 * @param messages - Array of UserPrompt objects.
 * @returns {UserPrompt[]} - Array of valid UserPrompt objects.
 */
export function extractValidMessages(
  messages: UserPrompt[]
): UserPrompt[] {
  return messages.filter((msg): msg is UserPrompt => {
    if (!msg.content) {
      logger.error(`app/api/chat/utils/filterContext.ts - Invalid message content: ${JSON.stringify(msg)}`);
      return false; // Exclude invalid messages
    }
    return true; // Include valid messages
  });
}

/**
 * Filters the context for the AI model based on the current conversation history.
 * @param messages - Array of UserPrompt objects representing the conversation history.
 * @returns {string} - The filtered context string.
 */
export function filterContext(messages: UserPrompt[]): string {
  const validMessages = extractValidMessages(messages);
  const concatenatedContent = validMessages.map(msg => msg.content).join('\n');
  return concatenatedContent;
}
