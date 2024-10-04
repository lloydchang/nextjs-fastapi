// File: app/api/chat/handlers/generatePrimary.ts

import { Config } from '../../../../utils/config';
import { isDefaultPlaceholder } from '../../../../utils/stringUtils';

/**
 * Function to generate text using the primary model (Google Vertex AI)
 * @param requestBody - Object containing the prompt, model name, and temperature for the generation request
 * @param config - Configuration object with necessary parameters for the Google Vertex AI API
 * @param logs - Array to store logs for the request flow
 * @returns - Generated text response from the primary model
 */
export async function generateTextWithPrimaryModel(
  requestBody: { prompt: string; model: string; temperature: number },
  config: Config,
  logs: string[]
): Promise<string> {
  const { googleCredentials, googleModel, googleProject, googleLocation } = config;

  // Validate Google Vertex AI configuration before proceeding
  if (
    !googleCredentials ||
    !googleModel ||
    !googleProject ||
    !googleLocation ||
    isDefaultPlaceholder(googleCredentials) ||
    isDefaultPlaceholder(googleProject)
  ) {
    throw new Error('Google Vertex AI configuration is missing or incomplete.');
  }

  try {
    // Lazy-load the Google Vertex AI service only when configuration is valid
    const { generateFromGoogleVertexAI } = await import('../services/google-vertex-ai');

    // Construct the full prompt by incorporating the system prompt
    const fullPrompt = `${config.systemPrompt}\n${requestBody.prompt}`;

    // Call the Vertex AI service with the required parameters
    const generatedText = await generateFromGoogleVertexAI({
      model: googleModel,
      prompt: fullPrompt,
      project: googleProject,
      location: googleLocation,
      credentials: googleCredentials,
    });

    logs.push('Text generated successfully using Google Vertex AI.');
    return generatedText;
  } catch (vertexError) {
    logs.push(`Google Vertex AI failed: ${vertexError.message}`);
    throw new Error(`Google Vertex AI failed: ${vertexError.message}`);
  }
}
