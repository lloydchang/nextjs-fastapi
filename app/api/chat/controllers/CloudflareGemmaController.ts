// File: app/api/chat/controllers/CloudflareGemmaController.ts

import logger from '../utils/logger';
import { generateFromCloudflareGemma } from '../clients/CloudflareGemmaClient';
import { getConfig } from '../utils/config';
import { validateEnvVars } from '../utils/validate';

/**
 * Handles text generation using the Cloudflare Gemma model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithCloudflareGemmaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { cloudflareGemmaEndpoint } = getConfig();

  // Check if the required endpoint is defined before proceeding
  if (!cloudflareGemmaEndpoint) {
    logger.silly('handleTextWithCloudflareGemmaTextModel - Missing Cloudflare Gemma endpoint.');
    return '';
  }

  logger.debug(`handleTextWithCloudflareGemmaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithCloudflareGemmaTextModel - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromCloudflareGemma({
      endpoint: cloudflareGemmaEndpoint, // Type is guaranteed to be string
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('handleTextWithCloudflareGemmaTextModel - Failed to generate text from Cloudflare Gemma.');
      return '';
    }

    logger.verbose(`handleTextWithCloudflareGemmaTextModel - Generated response: ${response}`);
    return response;

  } catch (error) {
    logger.error(`handleTextWithCloudflareGemmaTextModel - Error during text generation: ${error.message}`);
    return '';
  }
}
