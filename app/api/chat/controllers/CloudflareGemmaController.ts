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
  const {
    cloudflareGemmaEndpoint,
    cloudflareGemmaXAuthKey,
    cloudflareGemmaXAuthEmail,
    cloudflareGemmaBearerToken,
  } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['CLOUDFLARE_GEMMA_ENDPOINT'])) {
    // logger.silly('app/api/chat/controllers/CloudflareGemmaController.ts - Missing required endpoint environment variable');
    return '';
  }

  const hasApiKeyAndEmail = validateEnvVars(['CLOUDFLARE_GEMMA_X_AUTH_KEY', 'CLOUDFLARE_GEMMA_X_AUTH_EMAIL']);
  const hasBearerToken = validateEnvVars(['CLOUDFLARE_GEMMA_BEARER_TOKEN']);

  if (!hasApiKeyAndEmail && !hasBearerToken) {
    // logger.silly('app/api/chat/controllers/CloudflareGemmaController.ts - Missing required authentication environment variables. Either API Key + Email or Bearer Token is needed');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = cloudflareGemmaEndpoint as string;

  // logger.silly(`app/api/chat/controllers/CloudflareGemmaController.ts - Generating text for model: ${textModel}`);
  // logger.silly(`app/api/chat/controllers/CloudflareGemmaController.ts - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromCloudflareGemma({
      endpoint,
      prompt: userPrompt,
      model: textModel,
      token: cloudflareGemmaBearerToken || '',         // Pass Bearer token for Authorization
      xAuthEmail: cloudflareGemmaXAuthEmail || '',     // Changed to xAuthEmail
      xAuthKey: cloudflareGemmaXAuthKey || '',         // Changed to xAuthKey
    });

    if (!response) {
      logger.error('app/api/chat/controllers/CloudflareGemmaController.ts - Failed to generate text from Cloudflare Gemma.');
      return '';
    }

    // logger.silly(`app/api/chat/controllers/CloudflareGemmaController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/CloudflareGemmaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
