// services/serviceConfig.ts

import dotenv from 'dotenv';
dotenv.config();

import { serviceKeys } from './serviceKeys';

// if nothing appears in the console, it means that the serviceKeys object is empty
console.log("Service Keys in serviceConfig.ts:", serviceKeys);

// uncomment to test
// hardcoding this test
// serviceKeys['OPENAI_API_KEY'] = 'sk-test-openai-key';
// serviceKeys['OPENAI_API_BASE_URL'] = 'https://api.openai.com/v1/completions';

console.log("Service Keys in serviceConfig.ts:", serviceKeys);

// Log serviceKeys to inspect values
console.log("Loaded serviceKeys:", serviceKeys);

export const services = [
    { model: 'aws-bedrock', url: serviceKeys.AWS_API_BASE_URL, apiKey: serviceKeys.AWS_API_KEY }, // AWS Bedrock
    { model: 'azure-openai', url: serviceKeys.AZURE_API_BASE_URL, apiKey: serviceKeys.AZURE_API_KEY }, // Azure OpenAI
    { model: 'claude-v2', url: serviceKeys.ANTHROPIC_API_BASE_URL, apiKey: serviceKeys.ANTHROPIC_API_KEY }, // Anthropic
    { model: 'cohere-model', url: serviceKeys.COHERE_API_BASE_URL, apiKey: serviceKeys.COHERE_API_KEY }, // Cohere
    { model: 'google-gemini-1.5', url: serviceKeys.GOOGLE_API_BASE_URL, apiKey: serviceKeys.GOOGLE_API_KEY }, // Google Cloud
    { model: 'gpt-4', url: serviceKeys.OPENAI_API_BASE_URL, apiKey: serviceKeys.OPENAI_API_KEY }, // OpenAI
    { model: 'groq-accelerator', url: serviceKeys.GROQ_API_BASE_URL, apiKey: serviceKeys.GROQ_API_KEY }, // Groq
    { model: 'huggingface', url: serviceKeys.HUGGINGFACE_API_BASE_URL, apiKey: serviceKeys.HUGGINGFACE_API_KEY }, // Hugging Face
    { model: 'llama3.2', url: serviceKeys.OLLAMA_API_BASE_URL, apiKey: serviceKeys.OLLAMA_API_KEY }, // Local LLaMA
    { model: 'openrouter', url: serviceKeys.OPENROUTER_API_BASE_URL, apiKey: serviceKeys.OPENROUTER_API_KEY }, // OpenRouter
    { model: 'oracle-llama', url: serviceKeys.ORACLE_API_BASE_URL, apiKey: serviceKeys.ORACLE_API_KEY }, // Oracle Cloud
    { model: 'text-embedding-3-small', url: serviceKeys.OPENAI_API_BASE_URL, apiKey: serviceKeys.OPENAI_API_KEY }, // OpenAI Embeddings
];

console.log("Services configured:", services);
