import dotenv from 'dotenv';
dotenv.config();

import { serviceKeys } from './serviceKeys';

console.log("Service Keys in serviceConfig.ts:", serviceKeys);

// Define and filter the services based on the presence of a valid `apiKey`
export const services = [
    { model: 'aws-bedrock', url: process.env.NEXT_PUBLIC_AWS_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_AWS_API_KEY }, // AWS Bedrock
    { model: 'azure-openai', url: process.env.NEXT_PUBLIC_AZURE_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_AZURE_API_KEY }, // Azure OpenAI
    { model: 'claude-v2', url: process.env.NEXT_PUBLIC_ANTHROPIC_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_ANTHROPIC_API_KEY }, // Anthropic
    { model: 'cohere-model', url: process.env.NEXT_PUBLIC_COHERE_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_COHERE_API_KEY }, // Cohere
    { model: 'google-gemini-1.5', url: process.env.NEXT_PUBLIC_GOOGLE_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_GOOGLE_API_KEY }, // Google Cloud
    { model: 'gpt-4', url: process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_OPENAI_API_KEY }, // OpenAI
    { model: 'groq-accelerator', url: process.env.NEXT_PUBLIC_GROQ_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_GROQ_API_KEY }, // Groq
    { model: 'huggingface', url: process.env.NEXT_PUBLIC_HUGGINGFACE_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_HUGGINGFACE_API_KEY }, // Hugging Face
    { model: 'llama3.2', url: process.env.NEXT_PUBLIC_OLLAMA_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_OLLAMA_API_KEY }, // Local LLaMA
    { model: 'openrouter', url: process.env.NEXT_PUBLIC_OPENROUTER_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_OPENROUTER_API_KEY }, // OpenRouter
    { model: 'oracle-llama', url: process.env.NEXT_PUBLIC_ORACLE_API_BASE_URL, apiKey: serviceKeys.NEXT_PUBLIC_ORACLE_API_KEY }, // Oracle Cloud
].filter(service => service.apiKey && !service.apiKey.startsWith('your_'));

console.log("Services configured with valid keys:", services);
