// File: app/api/chat/handlers/handleAmazonBedrockTitan.ts

import fetch from 'node-fetch';
import logger from '../utils/log';

interface HandlerInput {
  prompt: string;
  model: string;
}

export async function handleTextWithAmazonBedrockTitan(input: HandlerInput, config: any): Promise<string> {
  const { prompt, model } = input;
  const endpoint = config.amazonBedrockTitanEndpoint;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.amazonBedrockTitanApiKey}`, // Assuming API key is required
      },
      body: JSON.stringify({
        model,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Amazon Bedrock Titan API error: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info(`Amazon Bedrock Titan raw response: ${JSON.stringify(data)}`);

    if (!data.response) {
      throw new Error('Amazon Bedrock Titan API did not return a "response" field.');
    }

    return data.response;
  } catch (error: any) {
    logger.error(`Error in handleAmazonBedrockTitan: ${error.message}`);
    throw error;
  }
}
