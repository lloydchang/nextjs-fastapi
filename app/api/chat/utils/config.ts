// File: app/api/chat/utils/config.ts

export function getConfig() {
  return {
    // Amazon Bedrock Titan
    amazonBedrockTitanModel: process.env.AMAZON_BEDROCK_TITAN_MODEL || '',
    amazonBedrockTitanEndpoint: process.env.AMAZON_BEDROCK_TITAN_ENDPOINT || '',
    amazonBedrockTitanApiKey: process.env.AMAZON_BEDROCK_TITAN_API_KEY || '',

    // Google Vertex Gemini
    googleVertexGeminiModel: process.env.GOOGLE_VERTEX_GEMINI_MODEL || '',
    googleVertexGeminiLocation: process.env.GOOGLE_VERTEX_GEMINI_LOCATION || '',
    googleVertexGeminiEndpoint: process.env.GOOGLE_VERTEX_GEMINI_ENDPOINT || '',
    googleVertexGeminiApiKey: process.env.GOOGLE_VERTEX_GEMINI_API_KEY || '',
    googleVertexGeminiTemperature: parseFloat(process.env.GOOGLE_VERTEX_GEMINI_TEMPERATURE || '0.7'),

    // Ollama Gemma
    ollamaGemmaModel: process.env.OLLAMA_GEMMA_MODEL || '',
    ollamaGemmaEndpoint: process.env.OLLAMA_GEMMA_ENDPOINT || '',

    // Ollama Llama
    ollamaLlamaModel: process.env.OLLAMA_LLAMA_MODEL || '',
    ollamaLlamaEndpoint: process.env.OLLAMA_LLAMA_ENDPOINT || '',

    // **Azure OpenAI O1 (New)**
    azureOpenAIO1Model: process.env.AZURE_OPENAI_O1_MODEL || '',
    azureOpenAIO1Endpoint: process.env.AZURE_OPENAI_O1_ENDPOINT || '',
    azureOpenAIO1ApiKey: process.env.AZURE_OPENAI_O1_API_KEY || '',

    // **OpenAI O1 (New)**
    openAIO1Model: process.env.OPENAI_O1_MODEL || '',
    openAIO1ApiKey: process.env.OPENAI_O1_API_KEY || '',
  };
}
