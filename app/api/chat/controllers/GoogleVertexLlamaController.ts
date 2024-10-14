// File: app/api/chat/controllers/GoogleVertexLlamaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromGoogleVertexLlama } from 'app/api/chat/clients/GoogleVertexLlamaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Google Vertex Llama model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithGoogleVertexLlamaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { googleVertexLlamaEndpoint } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['GOOGLE_VERTEX_GEMMA_ENDPOINT'])) {
    // logger.silly('app/api/chat/controllers/GoogleVertexLlamaController.ts - Missing required environment variables.');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = googleVertexLlamaEndpoint as string;

  // logger.silly(`app/api/chat/controllers/GoogleVertexLlamaController.ts - Generating text for model: ${textModel}`);
  // logger.silly(`app/api/chat/controllers/GoogleVertexLlamaController.ts - ${userPrompt}`);

  try {
    const response = await generateFromGoogleVertexLlama({
      endpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('app/api/chat/controllers/GoogleVertexLlamaController.ts - Failed to generate text from Google Vertex Llama.');
      return '';
    }

    // logger.silly(`app/api/chat/controllers/GoogleVertexLlamaController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/GoogleVertexLlamaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
