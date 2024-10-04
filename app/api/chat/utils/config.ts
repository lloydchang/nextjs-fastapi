// File: app/api/chat/utils/config.ts

import logger from '../utils/log';

/**
 * Configuration file for application settings and environment variables.
 */
export interface AppConfig {
  amazonBedrockTitanModel: string | undefined;
  amazonBedrockTitanEndpoint: string | undefined;
  googleApplicationCredentials: string | undefined;
  googleProject: string | undefined;
  googleVertexGeminiModel: string | undefined;
  googleVertexGeminiLocation: string | undefined;
  logsInResponse: boolean;
  ollamaGemmaModel: string | undefined;
  ollamaGemmaEndpoint: string | undefined;
  ollamaLlamaModel: string | undefined;
  ollamaLlamaEndpoint: string | undefined;
  rateLimitEnabled: boolean;
  streamEnabled: boolean;
  temperature: number;
}

/**
 * Fetches and returns the application configuration based on environment variables.
 * @returns {AppConfig} - Configuration object for the application.
 */
export const getConfig = (): AppConfig => {
  // Log configuration details as individual fields instead of a single object
  logger.info(
    `Amazon Bedrock Titan Config: Model - ${process.env.AMAZON_BEDROCK_TITAN_MODEL}, Endpoint - ${process.env.AMAZON_BEDROCK_TITAN_ENDPOINT}`
  );

  logger.info(
    `Google Vertex Gemini Config: Application Credentials - ${process.env.GOOGLE_APPLICATION_CREDENTIALS}, Project - ${process.env.GOOGLE_CLOUD_PROJECT}, Model - ${process.env.GOOGLE_VERTEX_GEMINI_MODEL}, Location - ${process.env.GOOGLE_VERTEX_GEMINI_LOCATION}`
  );

  logger.info(
    `Ollama Gemma Config: Model - ${process.env.OLLAMA_GEMMA_MODEL}, Endpoint - ${process.env.OLLAMA_GEMMA_ENDPOINT}`
  );

  logger.info(
    `Ollama Llama Config: Model - ${process.env.OLLAMA_LLAMA_MODEL}, Endpoint - ${process.env.OLLAMA_LLAMA_ENDPOINT}`
  );

  return {
    logsInResponse: process.env.LOGS_IN_RESPONSE === 'true',
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleVertexGeminiModel: process.env.GOOGLE_VERTEX_GEMINI_MODEL,
    googleProject: process.env.GOOGLE_CLOUD_PROJECT,
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION,
    amazonBedrockTitanModel: process.env.AMAZON_BEDROCK_TITAN_MODEL,
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT,
    ollamaGemmaModel: process.env.OLLAMA_GEMMA_MODEL,
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT,
    ollamaLlamaModel: process.env.OLLAMA_LLAMA_MODEL,
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT,
    streamEnabled: process.env.STREAM_ENABLED === 'true',
    temperature: parseFloat(process.env.TEMPERATURE || '2.0'),
  };
};
