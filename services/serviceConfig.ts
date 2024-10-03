// services/serviceConfig.ts

import { serviceKeys } from './serviceKeys';
import { serviceUrls } from './serviceUrls';
import { ServiceConfig } from './types';

export const services = [
    { model: 'aws-bedrock', url: serviceUrls.AWS_API_BASE_URL, apiKey: serviceKeys.AWS_API_KEY }, // AWS Bedrock
    { model: 'azure-openai', url: serviceUrls.AZURE_API_BASE_URL, apiKey: serviceKeys.AZURE_API_KEY }, // Azure OpenAI
    { model: 'claude-v2', url: serviceUrls.ANTHROPIC_API_BASE_URL, apiKey: serviceKeys.ANTHROPIC_API_KEY }, // Anthropic
    { model: 'cohere-model', url: serviceUrls.COHERE_API_BASE_URL, apiKey: serviceKeys.COHERE_API_KEY }, // Cohere
    { model: 'google-gemini-1.5', url: serviceUrls.GOOGLE_API_BASE_URL, apiKey: serviceKeys.GOOGLE_API_KEY }, // Google Cloud
    { model: 'gpt-4', url: serviceUrls.OPENAI_API_BASE_URL, apiKey: serviceKeys.OPENAI_API_KEY }, // OpenAI
    { model: 'groq-accelerator', url: serviceUrls.GROQ_API_BASE_URL, apiKey: serviceKeys.GROQ_API_KEY }, // Groq
    { model: 'huggingface', url: serviceUrls.HUGGINGFACE_API_BASE_URL, apiKey: serviceKeys.HUGGINGFACE_API_KEY }, // Hugging Face
    { model: 'llama3.2', url: serviceUrls.OLLAMA_API_BASE_URL, apiKey: serviceKeys.OLLAMA_API_KEY }, // Local LLaMA
    { model: 'openrouter', url: serviceUrls.OPENROUTER_API_BASE_URL, apiKey: serviceKeys.OPENROUTER_API_KEY }, // OpenRouter
    { model: 'oracle-llama', url: serviceUrls.ORACLE_API_BASE_URL, apiKey: serviceKeys.ORACLE_API_KEY }, // Oracle Cloud
    { model: 'text-embedding-3-small', url: serviceUrls.OPENAI_API_BASE_URL, apiKey: serviceKeys.OPENAI_API_KEY }, // OpenAI Embeddings
];
