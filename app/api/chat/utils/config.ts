// File: app/api/chat/utils/config.ts

import logger from './logger';

export function getConfig() {
  const config = {
    // Amazon Bedrock Titan
    amazonBedrockTitanTextModel: process.env.AMAZON_BEDROCK_TITAN_TEXT_MODEL || '',
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT || '',
    
    // Azure OpenAI O1
    azureOpenAIO1TextModel: process.env.AZURE_OPENAI_O1_TEXT_MODEL || '',
    azureOpenAIO1Endpoint: process.env.AZURE_OPENAI_O1_ENDPOINT || '',
    azureOpenAIO1ApiKey: process.env.AZURE_OPENAI_O1_API_KEY || '',
    
    // Google Vertex Gemini
    googleVertexGeminiTextModel: process.env.GOOGLE_VERTEX_GEMINI_TEXT_MODEL || '',
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION || '',
    googleVertexGeminiEndpoint: process.env.GOOGLE_VERTEX_GEMINI_ENDPOINT || '',
    googleVertexGeminiApiKey: process.env.GOOGLE_VERTEX_GEMINI_API_KEY || '',
    googleVertexGeminiTemperature: parseFloat(process.env.GOOGLE_VERTEX_GEMINI_TEMPERATURE) || 0.7,
    
    // Ollama Gemma
    ollamaGemmaTextModel: process.env.OLLAMA_GEMMA_TEXT_MODEL || '',
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT || '',
    
    // Ollama Llama
    ollamaLlamaTextModel: process.env.OLLAMA_LLAMA_TEXT_MODEL || '',
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT || '',
    
    // OpenAI O1
    openAIO1TextModel: process.env.OPENAI_O1_TEXT_MODEL || '',
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
