// File: app/api/chat/utils/config.ts

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Type definition for application configuration.
 */
export interface AppConfig {
  amazonBedrockTitanTextModel?: string;
  amazonBedrockTitanEmbeddingModel?: string;
  amazonBedrockTitanEndpoint?: string;
  azureOpenAIO1TextModel?: string;
  azureOpenAIO1EmbeddingModel?: string;
  azureOpenAIO1Endpoint?: string;
  azureOpenAIO1ApiKey?: string;
  cloudflareGemmaTextModel?: string;
  cloudflareGemmaEndpoint?: string;
  cloudflareGemmaApiKey?: string;
  googleVertexGeminiTextModel?: string;
  googleVertexGeminiEmbeddingModel?: string;
  googleVertexGeminiLocation?: string;
  googleVertexGeminiEndpoint?: string;
  googleApplicationCredentials?: string;
  googleCloudProject?: string;
  googleVertexGemmaTextModel?: string;
  googleVertexGemmaEndpoint?: string; 
  googleVertexGemmaLocation?: string; 
  ollamaGemmaTextModel?: string;
  ollamaGemmaEmbeddingModel?: string;
  ollamaGemmaEndpoint?: string;
  ollamaLlamaTextModel?: string;
  ollamaLlamaEmbeddingModel?: string;
  ollamaLlamaEndpoint?: string;
  openAIO1TextModel?: string;
  openAIO1EmbeddingModel?: string;
  openAIO1Endpoint?: string;
  openAIO1ApiKey?: string;
  streamEnabled?: boolean;
  temperature?: number;
  winstonLoggerLevel: string;
}

/**
 * Returns the configuration object with all necessary environment variables.
 */
export function getConfig(): AppConfig {
  return {
    amazonBedrockTitanTextModel: process.env.AMAZON_BEDROCK_TITAN_TEXT_MODEL,
    amazonBedrockTitanEmbeddingModel: process.env.AMAZON_BEDROCK_TITAN_EMBEDDING_MODEL,
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT,
    azureOpenAIO1TextModel: process.env.AZURE_OPENAI_O1_TEXT_MODEL,
    azureOpenAIO1EmbeddingModel: process.env.AZURE_OPENAI_O1_EMBEDDING_MODEL,
    azureOpenAIO1Endpoint: process.env.AZURE_OPENAI_O1_ENDPOINT,
    azureOpenAIO1ApiKey: process.env.AZURE_OPENAI_O1_API_KEY,
    cloudflareGemmaTextModel: process.env.CLOUDFLARE_GEMMA_TEXT_MODEL,
    cloudflareGemmaEndpoint: process.env.CLOUDFLARE_GEMMA_ENDPOINT,
    cloudflareGemmaApiKey: process.env.CLOUDFLARE_GEMMA_API_KEY,
    googleVertexGeminiTextModel: process.env.GOOGLE_VERTEX_GEMINI_TEXT_MODEL,
    googleVertexGeminiEmbeddingModel: process.env.GOOGLE_VERTEX_GEMINI_EMBEDDING_MODEL,
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION,
    googleVertexGeminiEndpoint: process.env.GOOGLE_VERTEX_GEMINI_ENDPOINT,
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT,
    googleVertexGemmaTextModel: process.env.GOOGLE_VERTEX_GEMMA_TEXT_MODEL,
    googleVertexGemmaEndpoint: process.env.GOOGLE_VERTEX_GEMMA_ENDPOINT, 
    googleVertexGemmaLocation: process.env.GOOGLE_VERTEX_GEMMA_LOCATION, 
    ollamaGemmaTextModel: process.env.OLLAMA_GEMMA_TEXT_MODEL,
    ollamaGemmaEmbeddingModel: process.env.OLLAMA_GEMMA_EMBEDDING_MODEL,
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT,
    ollamaLlamaTextModel: process.env.OLLAMA_LLAMA_TEXT_MODEL,
    ollamaLlamaEmbeddingModel: process.env.OLLAMA_LLAMA_EMBEDDING_MODEL,
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT,
    openAIO1TextModel: process.env.OPENAI_O1_TEXT_MODEL,
    openAIO1EmbeddingModel: process.env.OPENAI_O1_EMBEDDING_MODEL,
    openAIO1Endpoint: process.env.OPENAI_O1_ENDPOINT,
    openAIO1ApiKey: process.env.OPENAI_O1_API_KEY,
    streamEnabled: process.env.STREAM_ENABLED === 'true',
    temperature: parseFloat(process.env.TEMPERATURE || '0.0'),
    winstonLoggerLevel: process.env.WINSTON_LOGGER_LEVEL || 'debug',
  };
}
