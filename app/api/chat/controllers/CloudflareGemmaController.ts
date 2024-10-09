// File: app/api/chat/controllers/CloudflareGemmaController.ts

import logger from '../utils/logger';
import { generateFromCloudflareGemma } from '../clients/CloudflareGemmaClient';
import { getConfig } from '../utils/config';

export async function handleTextWithCloudflareGemmaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { cloudflareGemmaEndpoint } = getConfig();

  if (!cloudflareGemmaEndpoint || !textModel) {
    logger.silly('handleTextWithCloudflareGemmaTextModel - Missing required environment variables.');
    return '';
  }

  logger.debug(`handleTextWithCloudflareGemmaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithCloudflareGemmaTextModel - User prompt: ${userPrompt}`);

  const response = await generateFromCloudflareGemma({
    endpoint: cloudflareGemmaEndpoint,
    prompt: userPrompt,
    model: textModel,
  });

  if (!response) {
    logger.error('handleTextWithCloudflareGemmaTextModel - Failed to generate text from Cloudflare Gemma.');
    return '';
  }

  logger.verbose(`handleTextWithCloudflareGemmaTextModel - Generated response: ${response}`);
  return response;
}
