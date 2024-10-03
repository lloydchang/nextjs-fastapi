// services/serviceConfig.ts

import { serviceKeys } from './serviceKeys';

export const services = [
  { model: 'aws-bedrock', endpoint: 'https://bedrock.aws.com/v1/completions', apiKey: serviceKeys.aws }, // AWS Bedrock
  { model: 'azure-openai', endpoint: 'https://api.openai.azure.com/v1/completions', apiKey: serviceKeys.azure }, // Azure OpenAI
  { model: 'claude-v2', endpoint: 'https://api.anthropic.com/v1/complete', apiKey: serviceKeys.anthropic }, // Anthropic
  { model: 'cohere-model', endpoint: 'https://api.cohere.ai/v1/generate', apiKey: serviceKeys.cohere }, // Cohere
  { model: 'google-gemini-1.5', endpoint: 'https://api.google.com/v1/chat/gemini', apiKey: serviceKeys.google }, // Google Cloud
  { model: 'gpt-4', endpoint: 'https://api.openai.com/v1/completions', apiKey: serviceKeys.openAi }, // OpenAI
  { model: 'groq-accelerator', endpoint: 'https://api.groq.com/v1/generate', apiKey: serviceKeys.groq }, // Groq
  { model: 'huggingface', endpoint: 'https://api-inference.huggingface.co/models/gpt', apiKey: serviceKeys.huggingFace }, // Hugging Face
  { model: 'llama3.2', endpoint: 'http://localhost:11434/api/generate', apiKey: serviceKeys.ollama }, // Local LLaMA
  { model: 'openrouter', endpoint: 'https://openrouter.ai/api/v1/completions', apiKey: serviceKeys.openRouter }, // OpenRouter
  { model: 'oracle-llama', endpoint: 'https://api.oracle.com/v1/generative-ai', apiKey: serviceKeys.oracle }, // Oracle Cloud
  { model: 'text-embedding-3-small', endpoint: 'https://api.openai.com/v1/embeddings', apiKey: serviceKeys.openAi }, // OpenAI Embeddings
];
