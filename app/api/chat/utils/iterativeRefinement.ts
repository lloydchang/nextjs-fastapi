// File: app/api/chat/utils/iterativeRefinement.ts

import { updateContextHistory } from 'app/api/chat/utils/contextManager';
import { detectMissingContent } from 'app/api/chat/utils/detectMissingContent';
import { detectPlaceholders } from 'app/api/chat/utils/detectPlaceholders';
import { performInternetSearch } from 'app/api/chat/utils/duckDuckGoSearch';
import logger from 'app/api/chat/utils/logger';

/**
 * Performs iterative refinement of the prompt until the response is complete, aggregating responses across iterations.
 * @param basePrompt - The initial base system prompt
 * @param userPrompt - The user's prompt for context
 * @param generateResponseFn - The function to generate a response from the AI model
 * @returns { Promise<string> } - The final complete response after all iterations are finished
 */
export async function performIterativeRefinement(
  basePrompt: string,
  userPrompt: string,
  generateResponseFn: (prompt: string) => Promise<string>
): Promise<string> {
  let context = '';
  let finalResponse = '';
  let hasIncompleteContent = true;
  let iterationLimit = 5; // Adjust iteration limit for more flexibility
  let iterations = 0;

  while (hasIncompleteContent && iterations < iterationLimit) {
    iterations++; // Track the number of iterations to avoid endless loops

    // Generate the current system prompt based on context and user input
    const combinedPrompt = `User Prompt: ${userPrompt}\n\nSystem Prompt: ${basePrompt}\n\nContext: ${context}`;

    // Generate the response from the AI
    const latestResponse = await generateResponseFn(combinedPrompt);

    // Aggregate the latest response with the existing final response
    finalResponse += latestResponse; // Append latest response to finalResponse

    // Update context history with the aggregated response
    context = updateContextHistory(context, latestResponse);

    // Detect missing or incomplete content in the aggregated response
    const missingContent = detectMissingContent(basePrompt, finalResponse);

    // Detect placeholders in the latest response
    const hasPlaceholders = detectPlaceholders(latestResponse);

    // Log the current state before further refinement
    logger.silly(`Current context: ${context}`);
    logger.silly(`Missing content detected: ${JSON.stringify(missingContent)}`);
    logger.silly(`Has placeholders: ${hasPlaceholders}`);

    // Ensure missingContent is iterable
    const missingSections = missingContent?.missingSentences || [];

    // Handle incomplete content by generating focused prompts
    for (const incompleteSection of missingSections) {
      logger.silly(`Generating content for missing/incomplete section: ${incompleteSection}`);

      // Create a focused prompt to generate content for the incomplete section
      const focusedPrompt = `Please expand on or generate content for the following section:\n"${incompleteSection}"`;
      const generatedContent = await generateResponseFn(focusedPrompt);

      // Replace incomplete section with the generated content
      finalResponse = finalResponse.replace(incompleteSection, generatedContent);
      logger.silly(`Updated response after filling missing/incomplete section: ${finalResponse}`);
    }

    // Handle placeholders by performing a DuckDuckGo search if necessary
    if (hasPlaceholders) {
      const placeholderMatch = latestResponse.match(/\[(.*?)\]/);
      if (placeholderMatch) {
        const searchQuery = placeholderMatch[1]; // Extract the placeholder text
        const searchResults = await performInternetSearch(searchQuery);
        logger.silly(`DuckDuckGo search results for "${searchQuery}": ${JSON.stringify(searchResults)}`);

        // Assume the first search result is relevant; frame a question
        const questionPrompt = `Based on the search result: "${searchResults[0]}", provide a single word or phrase for the placeholder [${searchQuery}].`;
        const placeholderResponse = await generateResponseFn(questionPrompt);

        // Replace the placeholder in the aggregated response
        finalResponse = finalResponse.replace(`[${searchQuery}]`, placeholderResponse);
        logger.silly(`Updated response after filling placeholder: ${finalResponse}`);
      }
    }

    // Check if there are still incomplete sections or placeholders
    const updatedMissingContent = detectMissingContent(basePrompt, finalResponse);
    const updatedHasPlaceholders = detectPlaceholders(finalResponse);

    // Exit condition: no missing content and no placeholders
    if (updatedMissingContent.length === 0 && !updatedHasPlaceholders) {
      hasIncompleteContent = false;
    }

    // Safety check: stop if too many iterations
    if (iterations >= iterationLimit) {
      logger.error('Exceeded iteration limit during iterative refinement');
      break;
    }
  }

  // Return the final complete response after all iterations
  return finalResponse;
}
