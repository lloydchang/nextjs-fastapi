// File: app/api/chat/controllers/GoogleVertexGemmaController.ts

import logger from '../utils/logger';
import { generateFromGoogleVertexGemma } from '../clients/GoogleVertexGemmaClient';
import { getConfig } from '../utils/config';
import { validateEnvVars } from '../utils/validate'; // Ensure the utility is correctly imported

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
    logger.silly('handleTextWithGoogleVertexGemmaTextModel - Missing required environment variables.');
    return '';
  }

  logger.debug(`handleTextWithGoogleVertexGemmaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithGoogleVertexGemmaTextModel - User prompt: ${userPrompt}`);

  try {
    const response = await generateFromGoogleVertexGemma({
      endpoint: googleVertexGemmaEndpoint,
      prompt: userPrompt,
      model: textModel,
    });

    if (!response) {
      logger.error('handleTextWithGoogleVertexGemmaTextModel - Failed to generate text from Google Vertex Gemma.');
      return '';
    }

    logger.verbose(`handleTextWithGoogleVertexGemmaTextModel - Generated response: ${response}`);
    return response;

  } catch (error) {
    logger.error(`handleTextWithGoogleVertexGemmaTextModel - Error during text generation: ${error.message}`);
    return '';
  }
}
