// File: app/api/chat/handlers/generateFallback.ts

import { generateFromOllamaLLaMA } from '../services/ollama-llama';
import { Config } from '../../../../utils/config';

export async function generateTextWithFallbackModel(prompt: string, config: Config, logs: string[]): Promise<string> {
  if (!config.fallbackModel || !config.llamaEndpoint) {
    throw new Error('Fallback model or endpoint not configured.');
  }

  try {
    // Incorporate system prompt into the request
    const fullPrompt = `${config.systemPrompt}\n${prompt}`;
    const generatedText = await generateFromOllamaLLaMA(config.llamaEndpoint, fullPrompt, config.fallbackModel);
    logs.push('Text generated successfully using Ollama LLaMA.');
    return generatedText;
  } catch (llamaError) {
    throw new Error(`Ollama LLaMA failed: ${llamaError.message}`);
  }
}
