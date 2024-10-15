// File: app/api/chat/utils/promptManager.ts

import logger from 'app/api/chat/utils/logger';
import { truncatePrompt } from 'app/api/chat/utils/promptTruncator';

export async function* managePrompt(
  prompt: string,
  maxLength: number,
  summarizeFn: (text: string) => Promise<string | null>,
  clientId?: string, // Optional client ID for logging
  model?: string     // Optional model name for logging
): AsyncGenerator<string> {
  let currentPrompt = prompt;
  let lastYieldedPrompt = ''; // Track the last yielded prompt

  // Early exit: If the prompt length is within the limit, yield it as-is
  if (currentPrompt.length <= maxLength) {
    yield currentPrompt;
    return; // No need for further processing
  }

  let iteration = 0;
  const MAX_ITERATIONS = 5; // Prevent excessive iterations

  while (currentPrompt.length > maxLength && iteration < MAX_ITERATIONS) {
    // Calculate the excess length beyond maxLength
    const excessLength = currentPrompt.length - maxLength;
    const partToSummarize = currentPrompt.substring(0, excessLength);

    // logger.debug(`app/api/chat/utils/promptManager.ts - Summarizing ${excessLength} characters for clientId: ${clientId} using model: ${model}`);

    const summary = await summarizeFn(partToSummarize);

    if (summary && summary.length < partToSummarize.length) {
      // Replace only the summarized part without concatenating the remaining prompt
      currentPrompt = summary + currentPrompt.substring(excessLength);

      // Yield partial result to the caller only if it's different from the last yielded prompt
      if (currentPrompt !== lastYieldedPrompt && currentPrompt.trim().length > 0) {
        yield currentPrompt;
        lastYieldedPrompt = currentPrompt; // Update the last yielded prompt
      }
    } else {
      // If summarization fails or doesn't reduce the length enough, truncate instead
      currentPrompt = truncatePrompt(currentPrompt, maxLength);
      // logger.debug(`app/api/chat/utils/promptManager.ts - Prompt truncated for clientId: ${clientId}`);

      // Yield truncated prompt only if it's different from the last yielded prompt and not empty
      if (currentPrompt !== lastYieldedPrompt && currentPrompt.trim().length > 0) {
        yield currentPrompt; // Send the truncated prompt
        lastYieldedPrompt = currentPrompt; // Update the last yielded prompt
      }
      break;
    }

    iteration += 1;
  }

  // Yield the final prompt after all iterations are complete, if not already yielded
  if (currentPrompt !== lastYieldedPrompt && currentPrompt.trim().length > 0) {
    yield currentPrompt;
  } else if (currentPrompt.trim().length === 0 && currentPrompt !== lastYieldedPrompt) {
    // logger.warn(`app/api/chat/utils/promptManager.ts - Final prompt for clientId: ${clientId} is empty.`);
    yield ''; // Optionally yield an empty prompt or handle as needed
  }
}
