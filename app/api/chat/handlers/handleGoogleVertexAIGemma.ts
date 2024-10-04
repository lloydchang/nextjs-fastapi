// File: app/api/chat/handlers/handleGoogleVertexAIGemma.ts

import { AppConfig } from '../utils/config';
import logger from '../utils/logger';
import { generateFromGoogleVertexAI } from '../services/serveGoogleVertexAIGemma';

/**
 * Handles requests for the Google Vertex AI Gemini model.
 * @param requestBody - The request body containing the prompt and other parameters.
 * @param config - Application configuration settings.
 * @returns The generated text from Google Vertex AI.
 */
export async function handleWithGoogleVertexAIGeminiModel(requestBody: { prompt: string }, config: AppConfig): Promise<string> {
  if (!config.googleVertexAIGeminiModel) {
    throw new Error('Google Vertex AI Gemini model is not configured.');
  }

  try {
    const generatedText = await generateFromGoogleVertexAI({
      model: config.googleVertexAIGeminiModel,
      prompt: requestBody.prompt,
      project: config.googleProject,
      location: config.googleLocation,
      credentials: config.googleCredentials,
    });

    return generatedText;
  } catch (error) {
    logger.error('Error generating text with Google Vertex AI Gemini:', error);
    throw error;
  }
}
