// File: app/api/chat/services/serveOpenAIO1.ts

import fetch from 'node-fetch';
import logger from '../utils/log';

export async function serveOpenAIO1(prompt: string, model: string, config: any): Promise<string> {
  const endpoint = `https://api.openai.com/v1/engines/${model}/completions`;
  const apiKey = config.openAIO1ApiKey;

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
      throw new Error(`OpenAIO1 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].text) {
      throw new Error('OpenAIO1 API did not return a valid "text" field.');
    }

    return data.choices[0].text.trim();
  } catch (error: any) {
    logger.error(`Error in serveOpenAIO1: ${error.message}`);
    throw error;
  }
}
