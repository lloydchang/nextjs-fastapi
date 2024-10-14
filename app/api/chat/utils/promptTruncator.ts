// File: app/api/chat/utils/promptTruncator.ts

import logger from 'app/api/chat/utils/logger';

/**
 * Truncates the prompt to the maximum allowed length.
 * Preserves the most recent and relevant content.
 * @param prompt - The complete prompt string.
 * @param maxLength - The maximum allowed character length.
 * @returns {string} - The truncated prompt.
 */
export function truncatePrompt(prompt: string, maxLength: number): string {
  if (prompt.length <= maxLength) return prompt;

  // Split the prompt into lines for better truncation
  const lines = prompt.split('\n');
  let truncated = '';

  // Start adding lines from the end until reaching maxLength
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if ((truncated + line).length > maxLength) break;
    truncated = line + '\n' + truncated;
  }

  logger.debug(`app/api/chat/utils/promptTruncator.ts - Prompt truncated. New length: ${truncated.length}`);
  return truncated.trim();
}
