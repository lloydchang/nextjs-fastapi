// File: app/api/chat/clients/OpenAIClient.ts

import logger from '../utils/logger';

export async function OpenAIClient(prompt: string, model: string, config: any): Promise<string> {
  const endpoint = `https://api.openai.com/v1/engines/${model}/completions`;
  const apiKey = config.openAIO1ApiKey;

  logger.info(`app/api/chat/clients/OpenAIClient.ts - Sending request to OpenAI. Model: ${model}, Prompt: ${prompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      logger.error(`app/api/chat/clients/OpenAIClient.ts - API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenAIO1 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].text) {
      throw new Error('OpenAIO1 API did not return a valid "text" field.');
    }

    const result = data.choices[0].text.trim();
    logger.info(`app/api/chat/clients/OpenAIClient.ts - Received response: ${result}`);
    return result;
  } catch (error: any) {
    logger.error(`app/api/chat/clients/OpenAIClient.ts - Error: ${error.message}`);
    throw error;
  }
}
