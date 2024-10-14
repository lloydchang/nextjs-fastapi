// File: app/api/chat/controllers/CloudflareLlamaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromCloudflareLlama } from 'app/api/chat/clients/CloudflareLlamaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Cloudflare Llama model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithCloudflareLlamaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const {
    cloudflareLlamaEndpoint,
    cloudflareLlamaXAuthKey,
    cloudflareLlamaXAuthEmail,
    cloudflareLlamaBearerToken,
  } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['CLOUDFLARE_LLAMA_ENDPOINT'])) {
    // logger.silly('app/api/chat/controllers/CloudflareLlamaController.ts - Missing required endpoint environment variable');
    return '';
  }

  const hasApiKeyAndEmail = validateEnvVars(['CLOUDFLARE_LLAMA_X_AUTH_KEY', 'CLOUDFLARE_LLAMA_X_AUTH_EMAIL']);
  const hasBearerToken = validateEnvVars(['CLOUDFLARE_LLAMA_BEARER_TOKEN']);

  if (!hasApiKeyAndEmail && !hasBearerToken) {
    // logger.silly('app/api/chat/controllers/CloudflareLlamaController.ts - Missing required authentication environment variables. Either API Key + Email or Bearer Token is needed');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = cloudflareLlamaEndpoint as string;

  // logger.silly(`app/api/chat/controllers/CloudflareLlamaController.ts - Generating text for model: ${textModel}`);
  // logger.silly(`app/api/chat/controllers/CloudflareLlamaController.ts - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromCloudflareLlama({
      endpoint,
      prompt: userPrompt,
      model: textModel,
      token: cloudflareLlamaBearerToken || '',         // Pass Bearer token for Authorization
      xAuthEmail: cloudflareLlamaXAuthEmail || '',     // Changed to xAuthEmail
      xAuthKey: cloudflareLlamaXAuthKey || '',         // Changed to xAuthKey
    });

    if (!response) {
      logger.error('app/api/chat/controllers/CloudflareLlamaController.ts - Failed to generate text from Cloudflare Llama.');
      return '';
    }

    // logger.silly(`app/api/chat/controllers/CloudflareLlamaController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/CloudflareLlamaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
