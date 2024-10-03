// services/serviceKeys.ts

export const serviceKeys = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    aws: process.env.AWS_API_KEY,
    azure: process.env.AZURE_API_KEY,
    cohere: process.env.COHERE_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    groq: process.env.GROQ_API_KEY,
    huggingFace: process.env.HUGGINGFACE_API_KEY,
    ollama: 'ollama', // Ollama does not require an API key
    openAi: process.env.OPENAI_API_KEY,
    openRouter: process.env.OPENROUTER_API_KEY,
    oracle: process.env.ORACLE_API_KEY,
  };
  