// File: app/api/chat/services/serveGoogleVertexGemma.ts

import { VertexAI } from '@google-cloud/vertexai';
import { optionalVars as optionalEnvVars, validateAndLogEnvVars } from '../utils/validate';
import logger from '../utils/log';

// if (!validateAndLogEnvVars(optionalEnvVars, [])) {
//   logger.error('Environment configuration errors.');
//   throw new Error('Invalid environment configuration.');
// }

/**
 * Initializes and exports the Vertex AI client.
 */
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_VERTEX_LOCATION!,
});

/**
 * Generates content using the Google Vertex AI (Gemma) API.
 * @param model - The ID of the generative model to use.
 * @param prompt - The text prompt to generate content from.
 * @param project - Google Cloud Project ID.
 * @param location - Google Vertex location.
 * @param credentials - Google Credentials.
 * @returns The generated text.
 */
export async function generateFromGoogleVertexGemma({
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
}): Promise<string> {
  try {
    const generativeModel = vertexAI.getGenerativeModel({ model });
    const response = await generativeModel.generateContent(prompt);
    const contentResponse = await response.response;
    const generatedText = contentResponse.text || '';

    return generatedText;
  } catch (error) {
    logger.error('Error generating content from Google Vertex Gemma:', error);
    throw error;
  }
}
