// services/serviceKeys.ts

// console.log("Loaded environment variables:", process.env);

export const serviceKeys = {};

// Define the keys you want to add conditionally
const keysToCheck = [
    'NEXT_PUBLIC_ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_AWS_API_KEY',
    'NEXT_PUBLIC_AZURE_API_KEY',
    'NEXT_PUBLIC_COHERE_API_KEY',
    'NEXT_PUBLIC_GOOGLE_API_KEY',
    'NEXT_PUBLIC_GROQ_API_KEY',
    'NEXT_PUBLIC_HUGGINGFACE_API_KEY',
    'NEXT_PUBLIC_OLLAMA_API_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'NEXT_PUBLIC_OPENROUTER_API_KEY',
    'NEXT_PUBLIC_ORACLE_API_KEY'
];

// Dynamically add valid keys to the serviceKeys object
keysToCheck.forEach(key => {
    const value = process.env[key];
    if (value && !value.startsWith('your_')) {
        serviceKeys[key] = value;
    }
});
