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

  logger.info(`app/api/chat/handlers/handleAmazonBedrockTitan.ts - Handling text with Amazon Bedrock Titan. Model: ${model}, Prompt: ${prompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.amazonBedrockTitanApiKey}`,
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
    logger.info(`app/api/chat/handlers/handleAmazonBedrockTitan.ts - Received response: ${JSON.stringify(data)}`);

    if (!data.response) {
      throw new Error('Amazon Bedrock Titan API did not return a "response" field.');
    }

    return data.response;
  } catch (error: any) {
    logger.error(`app/api/chat/handlers/handleAmazonBedrockTitan.ts - Error: ${error.message}`);
    throw error;
  }
}
