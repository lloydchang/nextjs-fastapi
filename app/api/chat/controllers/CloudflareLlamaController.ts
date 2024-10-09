// File: app/api/chat/controllers/CloudflareLlamaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromCloudflareLlama } from 'app/api/chat/clients/CloudflareLlamaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

export async function handleTextWithCloudflareLlamaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { cloudflareLlamaEndpoint } = getConfig();

  if (!validateEnvVars(['CLOUDFLARE_LLAMA_ENDPOINT'])) {
    logger.silly('handleTextWithCloudflareLlamaTextModel - Missing required environment variables.');
    return '';
  }

  const endpoint = cloudflareLlamaEndpoint as string;

  logger.debug(`handleTextWithCloudflareLlamaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithCloudflareLlamaTextModel - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromCloudflareLlama({ endpoint, prompt: userPrompt, model: textModel });

    if (!response) {
      logger.error('handleTextWithCloudflareLlamaTextModel - Failed to generate text from Cloudflare Llama.');
      return '';
    }

    logger.verbose(`handleTextWithCloudflareLlamaTextModel - Generated response: ${response}`);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleTextWithCloudflareLlamaTextModel - Error during text generation: ${errorMessage}`);
    return '';
  }
}
