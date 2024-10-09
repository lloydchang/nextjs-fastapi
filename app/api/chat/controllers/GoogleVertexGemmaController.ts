// File: app/api/chat/controllers/GoogleVertexGemmaController.ts

import logger from '../utils/logger';
import { generateFromGoogleVertexGemma } from '../clients/GoogleVertexGemmaClient';
import { getConfig } from '../utils/config';

export async function handleTextWithGoogleVertexGemmaTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  const { googleVertexGemmaEndpoint } = getConfig();

  if (!googleVertexGemmaEndpoint || !textModel) {
    logger.silly('handleTextWithGoogleVertexGemmaTextModel - Missing required environment variables.');
    return '';
  }

  logger.debug(`handleTextWithGoogleVertexGemmaTextModel - Generating text for model: ${textModel}`);
  logger.silly(`handleTextWithGoogleVertexGemmaTextModel - User prompt: ${userPrompt}`);

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
}
