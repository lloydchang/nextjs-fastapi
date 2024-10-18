// File: app/api/chat/controllers/BotHandlers.ts

import { AppConfig } from 'app/api/chat/utils/config';
import { BotFunction } from 'types';
import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import { getMessageContent } from 'app/api/chat/utils/messageUtils'; // Import getMessageContent
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaController';
import { handleTextWithGoogleVertexGemmaTextModel } from 'app/api/chat/controllers/GoogleVertexGemmaController';
import { handleTextWithOllamaLlamaTextModel } from 'app/api/chat/controllers/OllamaLlamaController';
import { handleTextWithCloudflareLlamaTextModel } from 'app/api/chat/controllers/CloudflareLlamaController';
import { handleTextWithGoogleVertexLlamaTextModel } from 'app/api/chat/controllers/GoogleVertexLlamaController';
import { validateEnvVars } from 'app/api/chat/utils/validate';
import logger from 'app/api/chat/utils/logger';
import { isValidConfig } from 'app/api/chat/utils/validation'; // Import the shared utility

/**
 * Union type for text model configuration keys.
 */
type TextModelConfigKey =
  | 'ollamaGemmaTextModel'
  | 'ollamaLlamaTextModel'
  | 'cloudflareGemmaTextModel'
  | 'cloudflareLlamaTextModel'
  | 'googleVertexGemmaTextModel'
  | 'googleVertexLlamaTextModel';

/**
 * Adds bot functions to the provided array based on the configuration.
 * @param botFunctions - The array to populate with bot functions.
 * @param config - The application configuration.
 */
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
          const prompt = getMessageContent(validMessages); // Use getMessageContent

          if (!prompt.trim()) {
            logger.warn(`Empty prompt for persona: ${persona} ${model}`);
            return null;
          }
          return await handler({ userPrompt: prompt, textModel: model }, config);
        },
        valid: true, // Added 'valid' property
      });
    }
  });
}
