// File: app/api/chat/controllers/GoogleVertexGeminiController.ts

import logger from 'app/api/chat/utils/logger';
import { generateFromGoogleVertexGemini } from 'app/api/chat/clients/GoogleVertexGeminiClient';
import { getConfig } from 'app/api/chat/utils/config';
import { validateEnvVars } from 'app/api/chat/utils/validate';

/**
 * Handles text generation using the Google Vertex Gemini model.
 * @param param0 - Contains the user prompt and text model to be used.
 * @param config - Configuration object, if passed separately.
 * @returns {Promise<string>} - Generated response text.
 */
export async function handleTextWithGoogleVertexGeminiTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { googleVertexGeminiEndpoint } = getConfig();

  // Validate required environment variables
  if (!validateEnvVars(['GOOGLE_VERTEX_GEMINI_ENDPOINT'])) {
    logger.silly('app/api/chat/controllers/GoogleVertexGeminiController.ts - Missing required environment variables.');
    return '';
  }

  // Type assertion to ensure TypeScript knows the endpoint is defined
  const endpoint = googleVertexGeminiEndpoint as string;

  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Generating text for model: ${textModel}`);
  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - ${userPrompt}`);

  try {
    const response = await generateFromGoogleVertexGemini({
      endpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('app/api/chat/controllers/GoogleVertexGeminiController.ts - Failed to generate text from Google Vertex Gemini.');
      return '';
    }

    logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Generated response: ${response}`);
    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Error during text generation: ${errorMessage}`);
    return '';
  }
}
