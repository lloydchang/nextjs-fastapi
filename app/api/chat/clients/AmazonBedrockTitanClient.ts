// File: app/api/chat/clients/AmazonBedrockClient.ts

import { validateEnvVars } from 'app/api/chat/utils/validate';
import logger from '../utils/logger';
import { systemPrompt } from 'app/api/chat/utils/systemPrompt'; // Import systemPrompt

let hasWarnedAmazonBedrockTitan = false;

/**
 * Sends a POST request to the Amazon Bedrock Titan endpoint and retrieves the response.
 * @param endpoint - The local Amazon Bedrock Titan API endpoint.
 * @param prompt - The text prompt to send to the Bedrock Titan model.
 * @param model - The model name to use for generation.
 * @returns The generated text from the Amazon Bedrock Titan model.
 */
export async function generateFromAmazonBedrockTitan(endpoint: string, prompt: string, model: string): Promise<string | null> {
  const optionalVars = ['AMAZON_BEDROCK_TITAN_TEXT_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);
  if (!isValid) {
    if (!hasWarnedAmazonBedrockTitan) {
      logger.warn(`app/api/chat/clients/AmazonBedrockClient.ts - Optional environment variables are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedAmazonBedrockTitan = true;
    }
    return null;
  }

  const combinedPrompt = `${prompt}`;
  logger.info(`app/api/chat/clients/AmazonBedrockClient.ts - Sending request to Amazon Bedrock Titan. Endpoint: ${endpoint}, Model: ${model}, Prompt: ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.warn(`app/api/chat/clients/AmazonBedrockClient.ts - Service responded with status: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
      return null;
    }

    const responseBody = await response.json();
    const resultText = responseBody.text.trim();
    logger.info(`app/api/chat/clients/AmazonBedrockClient.ts - Generated Text: ${resultText}`);
    return resultText;
  } catch (error) {
    logger.warn(`app/api/chat/clients/AmazonBedrockClient.ts - Error generating content from Amazon Bedrock Titan: ${error}`);
    return null;
  }
}
