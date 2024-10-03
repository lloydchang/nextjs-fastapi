// services/serviceKeys.ts

export const serviceKeys = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AWS_API_KEY: process.env.AWS_API_KEY,
    AZURE_API_KEY: process.env.AZURE_API_KEY,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    OLLAMA_API_KEY: process.env.OLLAMA_API_KEY, // Ensure this is correctly referenced
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    ORACLE_API_KEY: process.env.ORACLE_API_KEY,
};

// Exclude any service keys that start with 'your_'
Object.keys(serviceKeys).forEach(key => {
    if (serviceKeys[key] && serviceKeys[key].startsWith('your_')) {
        delete serviceKeys[key];
    }
});
