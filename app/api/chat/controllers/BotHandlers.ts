// File: app/api/chat/controllers/BotHandlers.ts

import { AppConfig } from 'app/api/chat/utils/config';
import { BotFunction } from 'types';
import { extractValidMessages, getMessageContent } from 'app/api/chat/utils/filterContext';
// ... other imports remain the same ...

export function addBotFunctions(botFunctions: BotFunction[], config: AppConfig) {
  const handlers: Array<{
    persona: string;
    key: TextModelConfigKey;
    handler: (
      input: { userPrompt: string; textModel: string },
      config: AppConfig
    ) => Promise<string | null>;
    envVars: string[];
  }> = [
    { 
      persona: 'Ollama', 
      key: 'ollamaGemmaTextModel', 
      handler: handleTextWithOllamaGemmaTextModel,
      envVars: ['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT']
    },
    { 
      persona: 'Ollama', 
      key: 'ollamaLlamaTextModel', 
      handler: handleTextWithOllamaLlamaTextModel,
      envVars: ['OLLAMA_LLAMA_TEXT_MODEL', 'OLLAMA_LLAMA_ENDPOINT']
    },
    { 
      persona: 'Cloudflare', 
      key: 'cloudflareGemmaTextModel', 
      handler: handleTextWithCloudflareGemmaTextModel,
      envVars: ['CLOUDFLARE_GEMMA_TEXT_MODEL', 'CLOUDFLARE_GEMMA_ENDPOINT', 'CLOUDFLARE_GEMMA_BEARER_TOKEN']
    },
    { 
      persona: 'Cloudflare', 
      key: 'cloudflareLlamaTextModel', 
      handler: handleTextWithCloudflareLlamaTextModel,
      envVars: ['CLOUDFLARE_LLAMA_TEXT_MODEL', 'CLOUDFLARE_LLAMA_ENDPOINT', 'CLOUDFLARE_LLAMA_BEARER_TOKEN']
    },
    { 
      persona: 'Google Vertex', 
      key: 'googleVertexGemmaTextModel', 
      handler: handleTextWithGoogleVertexGemmaTextModel,
      envVars: ['GOOGLE_VERTEX_GEMMA_TEXT_MODEL', 'GOOGLE_VERTEX_GEMMA_ENDPOINT', 'GOOGLE_VERTEX_GEMMA_LOCATION']
    },
    { 
      persona: 'Google Vertex', 
      key: 'googleVertexLlamaTextModel', 
      handler: handleTextWithGoogleVertexLlamaTextModel,
      envVars: ['GOOGLE_VERTEX_LLAMA_TEXT_MODEL', 'GOOGLE_VERTEX_LLAMA_ENDPOINT', 'GOOGLE_VERTEX_LLAMA_LOCATION']
    },
  ];

  handlers.forEach(({ persona, key, handler, envVars }) => {
    const model = config[key];
    if (model && isValidConfig(model) && validateEnvVars(envVars)) {
      botFunctions.push({
        persona: `${persona} ${model}`,
        generate: async (context) => {
          const validMessages = extractValidMessages(context);
          const prompt = getMessageContent(validMessages);
          
          if (!prompt.trim()) {
            logger.warn(`Empty prompt for persona: ${persona} ${model}`);
            return null;
          }
          return await handler({ userPrompt: prompt, textModel: model }, config);
        },
        valid: true,
      });
    }
  });
}


