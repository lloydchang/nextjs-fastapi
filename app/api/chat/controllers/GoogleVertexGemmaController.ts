// File: app/api/chat/controllers/GoogleVertexGemmaController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromGoogleVertexGemma } from 'app/api/chat/clients/GoogleVertexGemmaClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Google Vertex Gemma model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithGoogleVertexGemmaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { googleVertexGemmaEndpoint } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['GOOGLE_VERTEX_GEMMA_ENDPOINT'])) {
    // logger.silly('app/api/chat/controllers/GoogleVertexGemmaController.ts - Missing required environment variables.');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = googleVertexGemmaEndpoint as string;

  // logger.silly(`app/api/chat/controllers/GoogleVertexGemmaController.ts - Generating text for model: ${textModel}`);
  // logger.silly(`app/api/chat/controllers/GoogleVertexGemmaController.ts - ${userPrompt}`);

  try {
    const response = await generateFromGoogleVertexGemma({
      endpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('app/api/chat/controllers/GoogleVertexGemmaController.ts - Failed to generate text from Google Vertex Gemma.');
      return '';
    }

    // logger.silly(`app/api/chat/controllers/GoogleVertexGemmaController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/GoogleVertexGemmaController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
