// File: app/api/chat/utils/promptManager.ts

import { truncatePrompt } from 'app/api/chat/utils/promptTruncator';
import logger from 'app/api/chat/utils/logger';

/**
 * Manages the prompt by truncating or summarizing when necessary.
 * Iteratively handles large prompts and yields updates in real-time.
 * @param prompt - The current prompt.
 * @param maxLength - The maximum allowed character length.
 * @param summarizeFn - A generic summarization function that takes (text: string) and returns a summary.
 * @param clientId - The client ID for tracking.
 * @param model - The model used for summarization.
 * @returns {AsyncGenerator<string>} - Yields managed prompt updates.
 */
export async function* managePrompt(
  prompt: string,
  maxLength: number,
  summarizeFn: (text: string) => Promise<string | null>,
  clientId?: string, // Optional client ID for logging
  model?: string     // Optional model name for logging
): AsyncGenerator<string> {
  let currentPrompt = prompt;

  while (currentPrompt.length > maxLength) {
    // Calculate the excess length beyond maxLength
    const excessLength = currentPrompt.length - maxLength;
    const partToSummarize = currentPrompt.substring(0, excessLength);

    logger.debug(`app/api/chat/utils/promptManager.ts - Summarizing ${excessLength} characters for clientId: ${clientId} using model: ${model}`);

    const summary = await summarizeFn(partToSummarize);

    if (summary && summary.length < partToSummarize.length) {
      // Replace only the summarized part without concatenating the remaining prompt
      currentPrompt = summary;
      // Yield partial result to the caller
      yield currentPrompt;
    } else {
      // If summarization fails or doesn't reduce the length enough, truncate instead
      currentPrompt = truncatePrompt(currentPrompt, maxLength);
      logger.debug(`app/api/chat/utils/promptManager.ts - Prompt truncated for clientId: ${clientId}`);
      yield currentPrompt; // Send the truncated prompt
      break;
    }
  }

  // Yield the final prompt after all iterations are complete
  yield currentPrompt;
}
