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
    const excessLength = currentPrompt.length - maxLength + 500; // Reserving extra space for the summary
    const partToSummarize = currentPrompt.substring(0, excessLength);
    
    logger.debug(`app/api/chat/utils/promptManager.ts - Summarizing ${excessLength} characters for clientId: ${clientId} using model: ${model}`);

    const summary = await summarizeFn(partToSummarize);

    if (summary) {
      // Replace the summarized part with the summary and append the remaining prompt
      const remainingPrompt = currentPrompt.substring(excessLength);
      currentPrompt = `Summary of previous conversation: ${summary}\n\n${remainingPrompt}`;

      // Yield partial result to the caller
      yield currentPrompt;
    } else {
      // If summarization fails, truncate instead
      currentPrompt = truncatePrompt(currentPrompt, maxLength);
      logger.debug(`app/api/chat/utils/promptManager.ts - Prompt truncated for clientId: ${clientId}`);
      yield currentPrompt; // Send the truncated prompt
      break;
    }
  }

  // Yield the final prompt after all iterations are complete
  yield currentPrompt;
}
