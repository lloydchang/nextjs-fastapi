// File: app/api/chat/utils/filterContext.ts

import logger from 'app/api/chat/utils/logger';
import { UserPrompt } from 'types';

/**
 * Filters the context for the AI model based on the current conversation history.
 * @param messages - Array of message objects representing the conversation history.
 * @returns {string} - The filtered context string.
 */
export function filterContext(messages: UserPrompt[]): string {
  const validMessages = extractValidMessages(messages);
  return validMessages.map(msg => msg.content).join('\n');
}

/**
 * Extracts valid messages by filtering out invalid ones.
 * Logs an error and skips any invalid messages.
 * @param messages - Array of message objects.
 * @returns {UserPrompt[]} - Array of valid UserPrompt objects.
 */
export function extractValidMessages(messages: any[]): UserPrompt[] {
  if (!Array.isArray(messages)) {
    logger.warn('Invalid messages format: not an array');
    return [];
  }

  return messages.filter((msg): msg is UserPrompt => {
    // Basic structure check
    if (!msg || typeof msg !== 'object') {
      logger.error('Invalid message format - not an object:', JSON.stringify(msg));
      return false;
    }

    // Required fields check
    if (!msg.content || !msg.role) {
      logger.error('Invalid message - missing required fields:', JSON.stringify(msg));
      return false;
    }

    // Content type check
    if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
      logger.error('Invalid message - invalid content:', JSON.stringify(msg));
      return false;
    }

    // Role validation
    const validRoles = ['system', 'user', 'bot', 'nudge'];
    if (typeof msg.role !== 'string' || !validRoles.includes(msg.role)) {
      logger.error('Invalid message - invalid role:', JSON.stringify(msg));
      return false;
    }

    // Optional persona check
    if (msg.persona !== undefined && typeof msg.persona !== 'string') {
      logger.error('Invalid message - invalid persona type:', JSON.stringify(msg));
      return false;
    }

    return true;
  });
}