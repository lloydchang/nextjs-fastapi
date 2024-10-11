// File: app/api/chat/controllers/GoogleVertexLlamaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromGoogleVertexLlama } from 'app/api/chat/clients/GoogleVertexLlamaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

export async function handleTextWithGoogleVertexLlamaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { googleVertexLlamaEndpoint } = getConfig();

  if (!validateEnvVars(['GOOGLE_VERTEX_LLAMA_ENDPOINT'])) {
    logger.silly('handleTextWithGoogleVertexLlamaTextModel - Missing required environment variables.');
    return '';
  }

  const endpoint = googleVertexLlamaEndpoint as string;

  logger.silly(`handleTextWithGoogleVertexLlamaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithGoogleVertexLlamaTextModel - ${userPrompt}`);

  try {
    const response = await generateFromGoogleVertexLlama({ endpoint, prompt: userPrompt, model: textModel });

    if (!response) {
      logger.error('handleTextWithGoogleVertexLlamaTextModel - Failed to generate text from Google Vertex Llama.');
      return '';
    }

    logger.silly(`handleTextWithGoogleVertexLlamaTextModel - Generated response: ${response}`);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`handleTextWithGoogleVertexLlamaTextModel - Error during text generation: ${errorMessage}`);
    return '';
  }
}
