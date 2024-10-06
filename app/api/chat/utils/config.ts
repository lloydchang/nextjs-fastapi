// File: app/api/chat/utils/config.ts

// Load environment variables from the .env file
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Returns the configuration object with all necessary environment variables.
 */
export function getConfig() {
  return {
    // Amazon Bedrock Titan Configuration
    amazonBedrockTitanTextModel: process.env.AMAZON_BEDROCK_TITAN_TEXT_MODEL,
    amazonBedrockTitanEmbeddingModel: process.env.AMAZON_BEDROCK_TITAN_EMBEDDING_MODEL,
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT,

    // Azure OpenAI O1 Configuration
    azureOpenAIO1TextModel: process.env.AZURE_OPENAI_O1_TEXT_MODEL,
    azureOpenAIO1EmbeddingModel: process.env.AZURE_OPENAI_O1_EMBEDDING_MODEL,
    azureOpenAIO1Endpoint: process.env.AZURE_OPENAI_O1_ENDPOINT,
    azureOpenAIO1ApiKey: process.env.AZURE_OPENAI_O1_API_KEY,

    // Google Vertex Gemini Configuration
    googleVertexGeminiTextModel: process.env.GOOGLE_VERTEX_GEMINI_TEXT_MODEL,
    googleVertexGeminiEmbeddingModel: process.env.GOOGLE_VERTEX_GEMINI_EMBEDDING_MODEL,
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION,
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT,

    // Ollama Gemma Configuration
    ollamaGemmaTextModel: process.env.OLLAMA_GEMMA_TEXT_MODEL,
    ollamaGemmaEmbeddingModel: process.env.OLLAMA_GEMMA_EMBEDDING_MODEL,
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT,

    // Ollama Llama Configuration
    ollamaLlamaTextModel: process.env.OLLAMA_LLAMA_TEXT_MODEL,
    ollamaLlamaEmbeddingModel: process.env.OLLAMA_LLAMA_EMBEDDING_MODEL,
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT,

    // OpenAI O1 Configuration
    openAIO1TextModel: process.env.OPENAI_O1_TEXT_MODEL,
    openAIO1EmbeddingModel: process.env.OPENAI_O1_EMBEDDING_MODEL,
    openAIO1Endpoint: process.env.OPENAI_O1_ENDPOINT,
    openAIO1ApiKey: process.env.OPENAI_O1_API_KEY,

    // Application Configuration
    streamEnabled: process.env.STREAM_ENABLED === 'true', // Streaming responses enabled
    temperature: parseFloat(process.env.TEMPERATURE || '0.0'), // Default to 0.0 if not set
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true', // Enable/disable rate limiting

    // Logger Level Configuration
    winstonLoggerLevel: process.env.WINSTON_LOGGER_LEVEL || 'info', // Set Winston logger level
  };
}
