// File: app/api/chat/handlers/handleOllamaGemma.ts

import { generateFromOllamaGemma } from '../services/serveOllamaGemma';
import { AppConfig } from '../utils/config';

/**
 * Handles text generation using the Ollama Gemma model.
 * @param prompt - The text prompt to be sent to the Ollama Gemma model.
 * @param config - Application configuration settings.
 * @param logs - Array to store logs for the request flow.
 * @returns - Generated text response from the Ollama Gemma model.
 */
export async function handleTextWithOllamaGemmaModel(prompt: string, config: AppConfig, logs: string[]): Promise<string> {
  const { ollamaGemmaModel, ollamaGemmaEndpoint } = config;

  if (!ollamaGemmaModel || !ollamaGemmaEndpoint) {
    throw new Error('Ollama Gemma configuration is missing or incomplete.');
  }

  try {
    const generatedText = await generateFromOllamaGemma(ollamaGemmaEndpoint, prompt, ollamaGemmaModel);
    logs.push('Text generated successfully using Ollama Gemma.');
    return generatedText;
  } catch (error) {
    logs.push(`Ollama Gemma failed: ${error.message}`);
    throw new Error(`Ollama Gemma failed: ${error.message}`);
  }
}
