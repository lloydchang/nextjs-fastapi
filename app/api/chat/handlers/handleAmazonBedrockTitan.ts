// File: app/api/chat/handlers/handleAmazonBedrockTitan.ts

import { makeRequest } from '../utils/request';
import { AppConfig } from '../utils/config';
import logger from '../utils/log';
import { validateEnvVars } from '../utils/validate';

let hasWarnedAmazonBedrockTitan = false;

/**
 * Handles text generation using Amazon Bedrock Titan model based on the given request.
 * @param requestBody - Object containing the prompt and model name for the generation request.
 * @param config - Application configuration settings.
 * @returns - Generated text response from the Amazon Bedrock Titan model.
 */
export async function handleTextWithAmazonBedrockTitan(
  requestBody: { prompt: string; model: string },
  config: AppConfig
): Promise<string> {
  const optionalVars = ['AMAZON_BEDROCK_TITAN_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);

  if (!isValid) {
    if (!hasWarnedAmazonBedrockTitan) {
      logger.debug(`Optional environment variables for Amazon Bedrock Titan are missing or contain your- placeholders: ${optionalVars.join(', ')}`);
      hasWarnedAmazonBedrockTitan = true;
    }
    return ''; // Return an empty string to handle the situation gracefully
  }

  logger.debug(`Amazon Bedrock Titan Request: ${JSON.stringify(requestBody)}`);

  try {
    const response = await makeRequest(config.amazonBedrockTitanEndpoint!, { prompt: requestBody.prompt, model: requestBody.model });
    const rawResponse = await response.text();
    logger.debug(`Raw Response from Amazon Bedrock Titan: ${rawResponse}`);

    if (!response.ok) {
      logger.warn(`Amazon Bedrock Titan Service Error. Status: ${response.status}, Body: ${rawResponse}`);
      return ''; // Return an empty string to handle the situation gracefully
    }

    try {
      const responseBody = JSON.parse(rawResponse);
      logger.debug(`Amazon Bedrock Titan Response: ${JSON.stringify(responseBody)}`);
      return responseBody.text.trim();
    } catch (jsonError) {
      logger.warn(`Failed to parse JSON from Amazon Bedrock Titan. Raw Response: ${rawResponse}`);
      return ''; // Return an empty string to handle the situation gracefully
    }
  } catch (error) {
    logger.warn(`Amazon Bedrock Titan: Exception in handleTextWithAmazonBedrockTitan: ${error.message}`);
    return ''; // Return an empty string to handle the situation gracefully
  }
}
