// File: app/api/chat/utils/sanitize.ts

/**
 * Sanitizes input text by escaping special characters.
 * @param input - The input text to be sanitized.
 * @returns {string} - The sanitized string.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
