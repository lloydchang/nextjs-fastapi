// File: app/api/chat/handlers/handleAmazonBedrockTitan.ts

import { AppConfig } from '../utils/config';

/**
 * Handles text generation using Amazon Bedrock Titan model.
 * @param requestBody - Object containing the prompt and model name for the generation request.
 * @param config - Application configuration settings.
 * @returns - Generated text response from the Amazon Bedrock Titan model.
 */
export async function handleTextWithAmazonBedrockTitan(
  requestBody: { prompt: string; model: string },
  config: AppConfig
): Promise<string> {
  const { amazonBedrockTitanEndpoint } = config;

  try {
    const response = await fetch(amazonBedrockTitanEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: requestBody.prompt, model: requestBody.model }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Amazon Bedrock Titan Server responded with status: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
    }

    const responseBody = await response.json();
    return responseBody.text.trim();
  } catch (error) {
    console.error('Error generating content from Amazon Bedrock Titan:', error);
    throw error;
  }
}
