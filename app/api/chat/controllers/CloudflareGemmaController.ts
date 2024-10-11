// File: app/api/chat/controllers/CloudflareGemmaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromCloudflareGemma } from 'app/api/chat/clients/CloudflareGemmaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

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

  // Validate required environment variables
  if (!validateEnvVars(['CLOUDFLARE_GEMMA_ENDPOINT, CLOUDFLARE_GEMMA_ACCOUNT_ID, CLOUDFLARE_GEMMA_API_KEY'])) {
    logger.silly('handleTextWithCloudflareGemmaTextModel - Missing required environment variables.');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = cloudflareGemmaEndpoint as string;

  logger.silly(`handleTextWithCloudflareGemmaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithCloudflareGemmaTextModel - ${userPrompt}`);

  try {
    const response = await generateFromCloudflareGemma({
      endpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('handleTextWithCloudflareGemmaTextModel - Failed to generate text from Cloudflare Gemma.');
      return '';
    }

    logger.silly(`handleTextWithCloudflareGemmaTextModel - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleTextWithCloudflareGemmaTextModel - Error during text generation: ${errorMessage}`);
    return '';
  }
}
