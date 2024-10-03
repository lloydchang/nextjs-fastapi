// services/serviceurls.ts

export const serviceurls = {};

// Define the urls you want to add conditionally
const urlsToCheck = [
    'ANTHROPIC_API_BASE_URL',
    'AWS_API_BASE_URL',
    'AZURE_API_BASE_URL',
    'COHERE_API_BASE_URL',
    'GOOGLE_API_BASE_URL',
    'GROQ_API_BASE_URL',
    'HUGGINGFACE_API_BASE_URL',
    'OLLAMA_API_BASE_URL',
    'OPENAI_API_BASE_URL',
    'OPENROUTER_API_BASE_URL',
    'ORACLE_API_BASE_URL'
];

// Dynamically add valid urls to the serviceurls object
urlsToCheck.forEach(url => {
    const value = process.env[url];
    if (value && !value.startsWith('your_')) {
        serviceurls[url] = value;
    }
});
