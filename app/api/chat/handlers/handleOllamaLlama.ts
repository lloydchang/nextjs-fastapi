// File: app/api/chat/handlers/handleOllamaLlama.ts

import { generateFromOllamaLlama } from '../services/serveOllamaLlama';
import { AppConfig } from '../utils/config';

/**
 * Handles text generation using the Ollama Llama model.
 * @param prompt - The text prompt to be sent to the Ollama Llama model.
 * @param config - Application configuration settings.
 * @param logs - Array to store logs for the request flow.
 * @returns - Generated text response from the Ollama Llama model.
 */
export async function handleTextWithOllamaLlamaModel(prompt: string, config: AppConfig, logs: string[]): Promise<string> {
  const { ollamaLLAMAModel, ollamaLlamaEndpoint } = config;

  if (!ollamaLLAMAModel || !ollamaLlamaEndpoint) {
    throw new Error('Ollama Llama configuration is missing or incomplete.');
  }

  try {
    const generatedText = await generateFromOllamaLlama(ollamaLlamaEndpoint, prompt, ollamaLLAMAModel);
    logs.push('Text generated successfully using Ollama Llama.');
    return generatedText;
  } catch (error) {
    logs.push(`Ollama Llama failed: ${error.message}`);
    throw new Error(`Ollama Llama failed: ${error.message}`);
  }
}
