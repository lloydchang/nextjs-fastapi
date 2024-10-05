// File: app/api/chat/utils/config.ts

import logger from './log';

export function getConfig() {
  const config = {
    // Amazon Bedrock Titan
    amazonBedrockTitanModel: process.env.AMAZON_BEDROCK_TITAN_TEXT_MODEL || '',
    amazonBedrockTitanEmbeddingModel: process.env.AMAZON_BEDROCK_TITAN_EMBEDDING_MODEL || '',
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT || '',
    amazonBedrockTitanApiKey: process.env.AMAZON_BEDROCK_TITAN_API_KEY || '',

    // Azure OpenAI O1
    azureOpenAIO1Model: process.env.AZURE_OPENAI_O1_TEXT_MODEL || '',
    azureOpenAIO1EmbeddingModel: process.env.AZURE_OPENAI_O1_EMBEDDING_MODEL || '',
    azureOpenAIO1Endpoint: process.env.AZURE_OPENAI_O1_ENDPOINT || '',
    azureOpenAIO1ApiKey: process.env.AZURE_OPENAI_O1_API_KEY || '',

    // Google Vertex Gemini
    googleVertexGeminiModel: process.env.GOOGLE_VERTEX_GEMINI_TEXT_MODEL || '',
    googleVertexGeminiEmbeddingModel: process.env.GOOGLE_VERTEX_GEMINI_EMBEDDING_MODEL || '',
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION || '',
    googleVertexGeminiEndpoint: process.env.GOOGLE_VERTEX_GEMINI_ENDPOINT || '',
    googleVertexGeminiApiKey: process.env.GOOGLE_VERTEX_GEMINI_API_KEY || '',
    googleVertexGeminiTemperature: parseFloat(process.env.GOOGLE_VERTEX_GEMINI_TEMPERATURE) || 0.7,

    // Ollama Gemma
    ollamaGemmaModel: process.env.OLLAMA_GEMMA_TEXT_MODEL || '',
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT || '',

    // Ollama Llama
    ollamaLlamaModel: process.env.OLLAMA_LLAMA_TEXT_MODEL || '',
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT || '',

    // OpenAI O1
    openAIO1Model: process.env.OPENAI_O1_TEXT_MODEL || '',
    openAIO1EmbeddingModel: process.env.OPENAI_O1_EMBEDDING_MODEL || '',
    openAIO1Endpoint: process.env.OPENAI_O1_ENDPOINT || '',
    openAIO1ApiKey: process.env.OPENAI_O1_API_KEY || '',

    // Application Configuration
    streamEnabled: process.env.STREAM_ENABLED === 'true',
    temperature: parseFloat(process.env.TEMPERATURE) || 0.0,
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
    logsInResponse: process.env.LOGS_IN_RESPONSE === 'true',
    winstonLogLevel: process.env.WINSTON_LOG_LEVEL || 'info',
  };

  logger.info('app/api/chat/utils/config.ts - Loaded configuration');
  return config;
}
