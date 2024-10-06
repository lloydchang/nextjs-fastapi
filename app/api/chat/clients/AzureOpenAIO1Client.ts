// File: app/api/chat/clients/AzureOpenAIClient.ts

import logger from '../utils/logger';

export async function AzureOpenAIClient(prompt: string, model: string, config: any): Promise<string> {
  const endpoint = config.azureOpenAIO1Endpoint;
  const apiKey = config.azureOpenAIO1ApiKey;

  logger.info(`app/api/chat/clients/AzureOpenAIClient.ts - Sending request to Azure OpenAI. Model: ${model}, Prompt: ${prompt}`);

  try {
    const response = await fetch(`${endpoint}/openai/deployments/${model}/completions?api-version=2023-03-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`app/api/chat/clients/AzureOpenAIClient.ts - API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`AzureOpenAIO1 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].text) {
      throw new Error('AzureOpenAIO1 API did not return a valid "text" field.');
    }

    const result = data.choices[0].text.trim();
    logger.info(`app/api/chat/clients/AzureOpenAIClient.ts - Received response: ${result}`);
    return result;
  } catch (error: any) {
    logger.error(`app/api/chat/clients/AzureOpenAIClient.ts - Error: ${error.message}`);
    throw error;
  }
}
