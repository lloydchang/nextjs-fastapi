// File: app/api/chat/services/serveGoogleVertexGemini.ts

import { Vertex } from '@google-cloud/vertexai';
import { validateEnvVars } from '../utils/validate';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt'; // Import systemPrompt

let hasWarnedGoogleVertexGemini = false;

/**
 * Generates content using the Google Vertex AI (Gemma) API.
 * @param model - The ID of the generative model to use.
 * @param prompt - The text prompt to generate content from.
 * @param project - Google Cloud Project ID.
 * @param location - Google Vertex location.
 * @param credentials - Google Credentials.
 * @returns The generated text.
 */
export async function generateFromGoogleVertexGemini({
  model,
  prompt,
  project,
  location,
  credentials,
}: {
  model: string;
  prompt: string;
  project: string;
  location: string;
  credentials: string;
}): Promise<string | null> {
  const optionalVars = [
    'GOOGLE_VERTEX_GEMINI_TEXT_MODEL',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLE_VERTEX_LOCATION',
    'GOOGLE_CLOUD_PROJECT',
  ];
  const isValid = validateEnvVars(optionalVars);

  if (!isValid) {
    if (!hasWarnedGoogleVertexGemini) {
      logger.warn(`app/api/chat/services/serveGoogleVertexGemini.ts - Optional environment variables are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedGoogleVertexGemini = true;
    }
    return null;
  }

  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.info(`app/api/chat/services/serveGoogleVertexGemini.ts - Sending request to Google Vertex Gemini. Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const vertex = new Vertex({ project, location });
    const generativeModel = vertex.getGenerativeModel({ model });
    const response = await generativeModel.generateContent(combinedPrompt);
    const contentResponse = await response.response;
    const generatedText = contentResponse.text || '';

    logger.info(`app/api/chat/services/serveGoogleVertexGemini.ts - Generated text from Google Vertex Gemini: ${generatedText}`);
    return generatedText;
  } catch (error) {
    logger.error(`app/api/chat/services/serveGoogleVertexGemini.ts - Error generating content from Google Vertex Gemini: ${error}`);
    return null;
  }
}
