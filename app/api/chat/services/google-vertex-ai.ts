// File: app/api/chat/services/google-vertex-ai.ts

import { VertexAI } from '@google-cloud/vertexai';
import { requiredEnvVars, validateAndLogEnvVars } from '../utils/envUtils';
import logger from '../utils/logger';

if (!validateAndLogEnvVars(requiredEnvVars, [])) {
  logger.error('Environment configuration errors.');
  throw new Error('Invalid environment configuration.');
}

/**
 * Initializes and exports the Vertex AI client.
 */
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_VERTEX_AI_LOCATION!,
});

/**
 * Generates content using the Google Vertex AI (Gemini) API.
 * 
 * @param modelId - The ID of the generative model to use.
 * @param prompt - The text prompt to generate content from.
 * @returns The generated text.
 */
export async function generateFromGoogleVertexAI(modelId: string, prompt: string): Promise<string> {
  try {
    const generativeModel = vertexAI.getGenerativeModel({ model: modelId });
    const response = await generativeModel.generateContent(prompt);
    const contentResponse = await response.response;
    const generatedText = contentResponse.text || '';

    return generatedText;
  } catch (error) {
    logger.error('Error generating content from Google Vertex AI:', error);
    throw error;
  }
}
