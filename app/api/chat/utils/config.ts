// File: app/api/chat/utils/config.ts

/**
 * Configuration file for application settings and environment variables.
 */
export interface AppConfig {
  logsInResponse: boolean;
  rateLimitEnabled: boolean;
  primaryModel: string;
  fallbackModel: string;
  googleCredentials: string | undefined;
  googleVertexGemmaModel: string | undefined;
  googleProject: string | undefined;
  googleLocation: string | undefined;
  amazonBedrockTitanModel: string | undefined;
  amazonBedrockTitanEndpoint: string | undefined;
  ollamaGemmaModel: string | undefined;
  ollamaGemmaEndpoint: string | undefined;
  ollamaLLAMAModel: string | undefined;
  ollamaLlamaEndpoint: string | undefined;
  streamEnabled: boolean;
  temperature: number;
}

/**
 * Fetches and returns the application configuration based on environment variables.
 * @returns {AppConfig} - Configuration object for the application.
 */
export const getConfig = (): AppConfig => {
  return {
    logsInResponse: process.env.LOGS_IN_RESPONSE === 'true',
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
    primaryModel: process.env.GOOGLE_VERTEX_MODEL || '',
    fallbackModel: process.env.OLLAMA_LLAMA_MODEL || '',
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleVertexGemmaModel: process.env.GOOGLE_VERTEX_MODEL,
    googleProject: process.env.GOOGLE_CLOUD_PROJECT,
    googleLocation: process.env.GOOGLE_VERTEX_LOCATION,
    amazonBedrockTitanModel: process.env.AMAZON_BEDROCK_TITAN_MODEL,
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT,
    ollamaGemmaModel: process.env.OLLAMA_GEMMA_MODEL,
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT,
    ollamaLLAMAModel: process.env.OLLAMA_LLAMA_MODEL,
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT,
    streamEnabled: process.env.STREAM_ENABLED === 'true',
    temperature: parseFloat(process.env.TEMPERATURE || '1.0'),
  };
};
