// services/serviceUrls.ts

export const serviceUrls = {
    ANTHROPIC_API_BASE_URL: process.env.ANTHROPIC_API_BASE_URL,
    AWS_API_BASE_URL: process.env.AWS_API_BASE_URL,
    AZURE_API_BASE_URL: process.env.AZURE_API_BASE_URL,
    COHERE_API_BASE_URL: process.env.COHERE_API_BASE_URL,
    GOOGLE_API_BASE_URL: process.env.GOOGLE_API_BASE_URL,
    GROQ_API_BASE_URL: process.env.GROQ_API_BASE_URL,
    HUGGINGFACE_API_BASE_URL: process.env.HUGGINGFACE_API_BASE_URL,
    OLLAMA_API_BASE_URL: process.env.OLLAMA_API_BASE_URL,
    OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
    OPENROUTER_API_BASE_URL: process.env.OPENROUTER_API_BASE_URL,
    ORACLE_API_BASE_URL: process.env.ORACLE_API_BASE_URL,
};

// Exclude any service URLs that start with 'your_'
Object.keys(serviceUrls).forEach(key => {
    if (serviceUrls[key] && serviceUrls[key].startsWith('your_')) {
        delete serviceUrls[key];
    }
});
