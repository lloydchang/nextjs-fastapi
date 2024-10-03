// services/serviceurls.ts

export const serviceurls = {};

// Define the urls you want to add conditionally
const urlsToCheck = [
    'NEXT_PUBLIC_ANTHROPIC_API_BASE_URL',
    'NEXT_PUBLIC_AWS_API_BASE_URL',
    'NEXT_PUBLIC_AZURE_API_BASE_URL',
    'NEXT_PUBLIC_COHERE_API_BASE_URL',
    'NEXT_PUBLIC_GOOGLE_API_BASE_URL',
    'NEXT_PUBLIC_GROQ_API_BASE_URL',
    'NEXT_PUBLIC_HUGGINGFACE_API_BASE_URL',
    'NEXT_PUBLIC_OLLAMA_API_BASE_URL',
    'NEXT_PUBLIC_OPENAI_API_BASE_URL',
    'NEXT_PUBLIC_OPENROUTER_API_BASE_URL',
    'NEXT_PUBLIC_ORACLE_API_BASE_URL'
];

// Dynamically add valid urls to the serviceurls object
urlsToCheck.forEach(url => {
    const value = process.env[url];
    if (value && !value.startsWith('your_')) {
        serviceurls[url] = value;
    }
});

console.log("Loaded service URLs:", serviceurls);
