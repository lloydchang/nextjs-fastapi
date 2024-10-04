// File: app/api/chat/handlers/handleGoogleVertexGemma.ts

import { generateFromGoogleVertexGemma } from '../services/serveGoogleVertexGemma';
import { AppConfig } from '../utils/config';

/**
 * Handles text generation using the Google Vertex AI Gemma model.
 * @param requestBody - Object containing the prompt, model name, and temperature for the generation request.
 * @param config - Application configuration settings.
 * @param logs - Array to store logs for the request flow.
 * @returns - Generated text response from the Google Vertex AI Gemma model.
 */
export async function handleTextWithGoogleVertexGemmaModel(
  requestBody: { prompt: string; model: string; temperature: number },
  config: AppConfig,
  logs: string[]
): Promise<string> {
  const { googleCredentials, googleVertexGemmaModel, googleProject, googleLocation } = config;

  if (!googleCredentials || !googleVertexGemmaModel || !googleProject || !googleLocation) {
    throw new Error('Google Vertex Gemma configuration is missing or incomplete.');
  }

  try {
    const generatedText = await generateFromGoogleVertexGemma({
      model: requestBody.model,
      prompt: requestBody.prompt,
      project: googleProject,
      location: googleLocation,
      credentials: googleCredentials,
    });

    logs.push('Text generated successfully using Google Vertex Gemma.');
    return generatedText;
  } catch (error) {
    logs.push(`Google Vertex Gemma failed: ${error.message}`);
    throw new Error(`Google Vertex Gemma failed: ${error.message}`);
  }
}
