// File: app/api/chat/handlers/generatePrimary.ts

import { generateFromGoogleVertexAI } from '../services/google-vertex-ai';
import { Config } from '../../../../utils/config';
import { isDefaultPlaceholder } from '../../../../utils/stringUtils';

export async function generateTextWithPrimaryModel(requestBody: { prompt: string; model: string; temperature: number }, config: Config, logs: string[]): Promise<string> {
  const { googleCredentials, googleModel, googleProject, googleLocation } = config;

  if (
    googleCredentials &&
    googleModel &&
    googleLocation &&
    !isDefaultPlaceholder(googleCredentials) &&
    !isDefaultPlaceholder(googleProject)
  ) {
    try {
      // Incorporate system prompt into the request
      const fullPrompt = `${config.systemPrompt}\n${requestBody.prompt}`;
      const generatedText = await generateFromGoogleVertexAI(googleModel, fullPrompt);
      logs.push('Text generated successfully using Google Vertex AI.');
      return generatedText;
    } catch (vertexError) {
      throw new Error(`Google Vertex AI failed: ${vertexError.message}`);
    }
  }
  throw new Error('Google Vertex AI configuration is missing or incomplete.');
}
