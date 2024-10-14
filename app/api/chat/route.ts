// File: app/api/chat/utils/promptManager.ts

import { truncatePrompt } from 'app/api/chat/utils/promptTruncator';
import logger from 'app/api/chat/utils/logger';

/**
 * Manages the prompt by truncating or summarizing when necessary.
 * @param prompt - The current prompt.
 * @param maxLength - The maximum allowed character length.
 * @param summarizeFn - A generic summarization function that takes (text: string) and returns a summary.
 * @param clientId - The client ID for tracking.
 * @param model - The model used for summarization.
 * @returns {Promise<string>} - The managed prompt.
 */
export async function managePrompt(
  prompt: string,
  maxLength: number,
  summarizeFn: (text: string) => Promise<string | null>,
  clientId?: string, // Optional client ID for logging
  model?: string     // Optional model name for logging
): Promise<string> {
  if (prompt.length <= maxLength) return prompt;

  // Option 1: Summarize the older part
  const excessLength = prompt.length - maxLength + 500; // Reserve extra for the summary
  const partToSummarize = prompt.substring(0, excessLength);
  logger.debug(`app/api/chat/utils/promptManager.ts - managePrompt - Summarizing first ${excessLength} characters for clientId: ${clientId} using model: ${model}`);

  const summary = await summarizeFn(partToSummarize);

  if (summary) {
    // Replace the old part with the summary
    const remainingPrompt = prompt.substring(excessLength);
    const newPrompt = `Summary of previous conversation: ${summary}\n\n${remainingPrompt}`;
    logger.debug(`app/api/chat/utils/promptManager.ts - managePrompt - Prompt managed by summarization for clientId: ${clientId} using model: ${model}`);
    return newPrompt;
  }

  // Option 2: Truncate if summarization fails
  const truncatedPrompt = truncatePrompt(prompt, maxLength);
  logger.debug(`app/api/chat/utils/promptManager.ts - managePrompt - Prompt managed by truncation for clientId: ${clientId}`);
  return truncatedPrompt;
}
