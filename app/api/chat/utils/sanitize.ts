// File: app/api/chat/utils/sanitize.ts

/**
 * Sanitizes a user input string to remove unwanted characters.
 * This function ensures that any potentially harmful inputs are safely processed.
 *
 * @param {string} input - The user input to be sanitized.
 * @returns {string} - The sanitized string.
 */
export function sanitizeInput(input: string): string {
    return input.replace(/[^\w\s.,!?'"-]/g, '').trim();
  }
  