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
    logger.silly('app/api/chat/controllers/CloudflareLlamaController.ts - Missing required environment variables.');
    return '';
  }

  const endpoint = cloudflareLlamaEndpoint as string;

  logger.silly(`app/api/chat/controllers/CloudflareLlamaController.ts - Generating text for model: ${textModel}`);
  logger.silly(`app/api/chat/controllers/CloudflareLlamaController.ts - ${userPrompt}`);

  try {
    const response = await generateFromCloudflareLlama({ endpoint, prompt: userPrompt, model: textModel });

    if (!response) {
      logger.error('app/api/chat/controllers/CloudflareLlamaController.ts - Failed to generate text from Cloudflare Llama.');
      return '';
    }

    logger.silly(`app/api/chat/controllers/CloudflareLlamaController.ts - Generated response: ${response}`);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/CloudflareLlamaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
