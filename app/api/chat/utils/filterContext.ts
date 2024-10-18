// File: app/api/chat/utils/filterContext.ts

import logger from 'app/api/chat/utils/logger';
import { UserPrompt } from 'types';

/**
 * Extracts valid messages and returns them as UserPrompt objects.
 * @param messages - Array of potential message objects.
 * @returns {UserPrompt[]} - Array of valid UserPrompt objects.
 */
export function extractValidMessages(messages: any[]): UserPrompt[] {
  if (!Array.isArray(messages)) {
    logger.warn('Invalid messages format: not an array');
    return [];
  }

  return messages.filter((msg): msg is UserPrompt => {
    if (!msg || typeof msg !== 'object') {
      logger.error('Invalid message format - not an object:', JSON.stringify(msg));
      return false;
    }

    if (!msg.content || !msg.role) {
      logger.error('Invalid message - missing required fields:', JSON.stringify(msg));
      return false;
    }

    if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
      logger.error('Invalid message - invalid content:', JSON.stringify(msg));
      return false;
    }

    const validRoles = ['system', 'user', 'bot', 'nudge'];
    if (typeof msg.role !== 'string' || !validRoles.includes(msg.role)) {
      logger.error('Invalid message - invalid role:', JSON.stringify(msg));
      return false;
    }

    if (msg.persona !== undefined && typeof msg.persona !== 'string') {
      logger.error('Invalid message - invalid persona type:', JSON.stringify(msg));
      return false;
    }

    return true;
  });
}

/**
 * Extracts message content from valid messages and returns as a concatenated string.
 * @param messages - Array of message objects.
 * @returns {string} - Concatenated message contents.
 */
export function getMessageContent(messages: UserPrompt[]): string {
  return messages.map(msg => msg.content).join('\n');
}
