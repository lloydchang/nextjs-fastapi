// File: app/api/chat/utils/config.ts

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Type definition for application configuration.
 */
export interface AppConfig {
  // Amazon Bedrock
  amazonBedrockTitanTextModel: string;
  amazonBedrockTitanEmbeddingModel: string;
  amazonBedrockTitanEndpoint: string;

  // Azure OpenAI
  azureOpenAIO1TextModel: string;
  azureOpenAIO1EmbeddingModel: string;
  azureOpenAIO1Endpoint: string;
  azureOpenAIO1ApiKey: string;

  // Cloudflare Gemma
  cloudflareGemmaTextModel: string;
  cloudflareGemmaEndpoint: string;
  cloudflareGemmaBearerToken: string;
  cloudflareGemmaXAuthEmail: string;
  cloudflareGemmaXAuthKey: string;

  // Cloudflare Llama
  cloudflareLlamaTextModel: string;
  cloudflareLlamaEmbeddingModel: string;
  cloudflareLlamaEndpoint: string;
  cloudflareLlamaBearerToken: string;
  cloudflareLlamaXAuthEmail: string;
  cloudflareLlamaXAuthKey: string;

  // Google Vertex Gemini
  googleVertexGeminiTextModel: string;
  googleVertexGeminiEmbeddingModel: string;
  googleVertexGeminiLocation: string;
  googleVertexGeminiEndpoint: string;

  // Google Vertex Gemma
  googleVertexGemmaTextModel: string;
  googleVertexGemmaEndpoint: string; 
  googleVertexGemmaLocation: string; 

  // Google Vertex Llama
  googleVertexLlamaTextModel: string;
  googleVertexLlamaEmbeddingModel: string;
  googleVertexLlamaEndpoint: string;
  googleVertexLlamaLocation: string;

  // Ollama Gemma
  ollamaGemmaTextModel: string;
  ollamaGemmaEmbeddingModel: string;
  ollamaGemmaEndpoint: string;

  // Ollama Llama
  ollamaLlamaTextModel: string;
  ollamaLlamaEmbeddingModel: string;
  ollamaLlamaEndpoint: string;

  // OpenAI O1
  openAIO1TextModel: string;
  openAIO1EmbeddingModel: string;
  openAIO1Endpoint: string;
  openAIO1ApiKey: string;

  // General Configurations
  systemPrompt: string;
  stream: boolean;
  temperature: number;
  winstonLoggerLevel: string;
}

/**
 * Returns the configuration object with all necessary environment variables.
 * Assigns default values to ensure they are never undefined.
 */
export function getConfig(): AppConfig {
  return {
    // Amazon Bedrock
    amazonBedrockTitanTextModel: process.env.AMAZON_BEDROCK_TITAN_TEXT_MODEL || '',
    amazonBedrockTitanEmbeddingModel: process.env.AMAZON_BEDROCK_TITAN_EMBEDDING_MODEL || '',
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT || '',

    // Azure OpenAI
    azureOpenAIO1TextModel: process.env.AZURE_OPENAI_O1_TEXT_MODEL || '',
    azureOpenAIO1EmbeddingModel: process.env.AZURE_OPENAI_O1_EMBEDDING_MODEL || '',
    azureOpenAIO1Endpoint: process.env.AZURE_OPENAI_O1_ENDPOINT || '',
    azureOpenAIO1ApiKey: process.env.AZURE_OPENAI_O1_API_KEY || '',

    // Cloudflare Gemma
    cloudflareGemmaTextModel: process.env.CLOUDFLARE_GEMMA_TEXT_MODEL || '',
    cloudflareGemmaEndpoint: process.env.CLOUDFLARE_GEMMA_ENDPOINT || '',
    cloudflareGemmaBearerToken: process.env.CLOUDFLARE_GEMMA_BEARER_TOKEN || '',
    cloudflareGemmaXAuthEmail: process.env.CLOUDFLARE_GEMMA_X_AUTH_EMAIL || '',
    cloudflareGemmaXAuthKey: process.env.CLOUDFLARE_GEMMA_X_AUTH_KEY || '',

    // Cloudflare Llama
    cloudflareLlamaTextModel: process.env.CLOUDFLARE_LLAMA_TEXT_MODEL || '',
    cloudflareLlamaEmbeddingModel: process.env.CLOUDFLARE_LLAMA_EMBEDDING_MODEL || '',
    cloudflareLlamaEndpoint: process.env.CLOUDFLARE_LLAMA_ENDPOINT || '',
    cloudflareLlamaBearerToken: process.env.CLOUDFLARE_LLAMA_BEARER_TOKEN || '',
    cloudflareLlamaXAuthEmail: process.env.CLOUDFLARE_LLAMA_X_AUTH_EMAIL || '',
    cloudflareLlamaXAuthKey: process.env.CLOUDFLARE_LLAMA_X_AUTH_KEY || '',

    // Google Vertex Gemini
    googleVertexGeminiTextModel: process.env.GOOGLE_VERTEX_GEMINI_TEXT_MODEL || '',
    googleVertexGeminiEmbeddingModel: process.env.GOOGLE_VERTEX_GEMINI_EMBEDDING_MODEL || '',
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION || '',
    googleVertexGeminiEndpoint: process.env.GOOGLE_VERTEX_GEMINI_ENDPOINT || '',

    // Google Vertex Gemma
    googleVertexGemmaTextModel: process.env.GOOGLE_VERTEX_GEMMA_TEXT_MODEL || '',
    googleVertexGemmaEndpoint: process.env.GOOGLE_VERTEX_GEMMA_ENDPOINT || '', 
    googleVertexGemmaLocation: process.env.GOOGLE_VERTEX_GEMMA_LOCATION || '', 

    // Google Vertex Llama
    googleVertexLlamaTextModel: process.env.GOOGLE_VERTEX_LLAMA_TEXT_MODEL || '',
    googleVertexLlamaEmbeddingModel: process.env.GOOGLE_VERTEX_LLAMA_EMBEDDING_MODEL || '',
    googleVertexLlamaEndpoint: process.env.GOOGLE_VERTEX_LLAMA_ENDPOINT || '',
    googleVertexLlamaLocation: process.env.GOOGLE_VERTEX_LLAMA_LOCATION || '',

    // Ollama Gemma
    ollamaGemmaTextModel: process.env.OLLAMA_GEMMA_TEXT_MODEL || '',
    ollamaGemmaEmbeddingModel: process.env.OLLAMA_GEMMA_EMBEDDING_MODEL || '',
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT || '',

    // Ollama Llama
    ollamaLlamaTextModel: process.env.OLLAMA_LLAMA_TEXT_MODEL || '',
    ollamaLlamaEmbeddingModel: process.env.OLLAMA_LLAMA_EMBEDDING_MODEL || '',
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT || '',

    // OpenAI O1
    openAIO1TextModel: process.env.OPENAI_O1_TEXT_MODEL || '',
    openAIO1EmbeddingModel: process.env.OPENAI_O1_EMBEDDING_MODEL || '',
    openAIO1Endpoint: process.env.OPENAI_O1_ENDPOINT || '',
    openAIO1ApiKey: process.env.OPENAI_O1_API_KEY || '',

    // General Configurations
    systemPrompt: process.env.SYSTEM_PROMPT || '',
    stream: process.env.STREAM === 'true',
    temperature: parseFloat(process.env.TEMPERATURE || '0.0'),
    winstonLoggerLevel: process.env.WINSTON_LOGGER_LEVEL || 'silly',
  };
}
