// services/serviceKeys.ts

console.log("Loaded environment variables:", process.env);

export const serviceKeys = {};

// Define the keys you want to add conditionally
const keysToCheck = [
    'ANTHROPIC_API_KEY',
    'AWS_API_KEY',
    'AZURE_API_KEY',
    'COHERE_API_KEY',
    'GOOGLE_API_KEY',
    'GROQ_API_KEY',
    'HUGGINGFACE_API_KEY',
    'OLLAMA_API_KEY',
    'OPENAI_API_KEY',
    'OPENROUTER_API_KEY',
    'ORACLE_API_KEY'
];

// Dynamically add valid keys to the serviceKeys object
keysToCheck.forEach(key => {
    const value = process.env[key];
    if (value && !value.startsWith('your_')) {
        serviceKeys[key] = value;
    }
});

console.log("Service Keys in serviceConfig.ts:", serviceKeys);
