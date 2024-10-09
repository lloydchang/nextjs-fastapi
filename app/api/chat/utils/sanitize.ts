// File: app/api/chat/utils/sanitize.ts

/**
 * Sanitizes input text by escaping special HTML characters and removing unwanted special characters.
 * - Escapes HTML special characters like &, <, >, ", and '.
 * - Removes any other non-standard characters that are not typically used in text processing.
 * - Replaces newlines with spaces.
 * - Trims and consolidates multiple spaces.
 * @param input - The input text to be sanitized.
 * @returns {string} - The fully sanitized string.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")         // Escape ampersand
    .replace(/</g, "&lt;")          // Escape less-than
    .replace(/>/g, "&gt;")          // Escape greater-than
    .replace(/"/g, "&quot;")        // Escape double-quote
    .replace(/'/g, "&#039;")        // Escape single-quote
    .replace(/[^\w\s.,?!]/g, '')    // Remove other special characters
    .replace(/\n+/g, ' ')           // Replace newlines with spaces
    .replace(/\s\s+/g, ' ')         // Consolidate multiple spaces
    .trim();                        // Trim leading and trailing spaces
}
