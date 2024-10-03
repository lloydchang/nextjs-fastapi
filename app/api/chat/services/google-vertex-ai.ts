// File: lib/google-vertex-ai.ts

import { VertexAI } from '@google-cloud/vertexai';

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
    // Get the specified generative model
    const generativeModel = vertexAI.getGenerativeModel({
      model: modelId,
    });

    // Generate content based on the prompt
    const response = await generativeModel.generateContent(prompt);

    // Wait for the response
    const contentResponse = await response.response;

    // Extract the generated text
    const generatedText = contentResponse.text || '';

    return generatedText;
  } catch (error) {
    console.error('Error generating content from Google Vertex AI:', error);
    throw error;
  }
}
