// File: app/api/chat/handlers/handleGoogleVertexGemini.ts

import { makeRequest } from '../utils/request';
import { AppConfig } from '../utils/config';
import logger from '../utils/log';
import { validateEnvVars } from '../utils/validate';

let hasWarnedGoogleVertexGemini = false;

/**
 * Handles text generation using the Google Vertex Gemini model.
 * @param requestBody - Object containing the prompt, model name, and temperature for the generation request.
 * @param config - Application configuration settings.
 * @returns - Generated text response from the Google Vertex Gemini model.
 */
export async function handleTextWithGoogleVertexGeminiModel(
  requestBody: { prompt: string; model: string; temperature: number },
  config: AppConfig
): Promise<string> {
  const optionalVars = [
    'GOOGLE_VERTEX_GEMINI_MODEL',
    'GOOGLE_VERTEX_GEMINI_LOCATION',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLE_CLOUD_PROJECT',
  ];
  const isValid = validateEnvVars(optionalVars);

  if (!isValid) {
    if (!hasWarnedGoogleVertexGemini) {
      logger.debug(`Optional environment variables for Google Vertex Gemini are missing or contain your- placeholders: ${optionalVars.join(', ')}`);
      hasWarnedGoogleVertexGemini = true; // Set the flag to prevent further warnings
    }
    return ''; // Return an empty string to handle the situation gracefully
  }

  logger.debug(`Google Vertex Gemini Request: ${JSON.stringify(requestBody)}`);

  try {
    const response = await makeRequest(config.googleVertexGeminiLocation!, {
      prompt: requestBody.prompt,
      model: requestBody.model,
      temperature: requestBody.temperature,
      credentials: config.googleApplicationCredentials!,
      project: config.googleProject!,
    });

    const rawResponse = await response.text();
    logger.debug(`Raw Response from Google Vertex Gemini: ${rawResponse}`);

    if (!response.ok) {
      logger.warn(`Google Vertex Gemini Service Error. Status: ${response.status}, Body: ${rawResponse}`);
      return ''; // Return an empty string to handle the situation gracefully
    }

    try {
      const responseBody = JSON.parse(rawResponse);
      logger.debug(`Google Vertex Gemini Response: ${JSON.stringify(responseBody)}`);
      return responseBody.text.trim();
    } catch (jsonError) {
      logger.warn(`Google Vertex Gemini: Failed to parse JSON from response. Raw Response: ${rawResponse}`);
      return ''; // Return an empty string to handle the situation gracefully
    }
  } catch (error) {
    logger.warn(`Google Vertex Gemini: Exception in handleTextWithGoogleVertexGeminiModel: ${error.message}`);
    return ''; // Return an empty string to handle the situation gracefully
  }
}
