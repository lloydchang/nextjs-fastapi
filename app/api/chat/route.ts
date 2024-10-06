// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithAmazonBedrockTitanTextModel } from './controllers/AmazonBedrockTitanController';
import { handleTextWithAzureOpenAIO1TextModel } from './controllers/AzureOpenAIO1Controller';
import { handleTextWithGoogleVertexGeminiTextModel } from './controllers/GoogleVertexGeminiController';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import { handleTextWithOllamaLlamaTextModel } from './controllers/OllamaLlamaController';
import { handleTextWithOpenAIO1TextModel } from './controllers/OpenAIO1Controller';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/logger';
import { validateEnvVars } from './utils/validate';

const config = getConfig();

let warnings = {
  AmazonBedrockTitan: false,
  AzureOpenAIO1: false,
  GoogleVertexGemini: false,
  OllamaGemma: false,
  OllamaLlama: false,
  OpenA1: false,
};

export async function POST(request: NextRequest) {
  try {
    logger.debug(`app/api/chat/route.ts - Handling POST request`);

    const requestBody = await request.json();
    logger.debug(`app/api/chat/route.ts - Received request body: ${JSON.stringify(requestBody)}`);

    const { messages } = requestBody;

    if (!Array.isArray(messages)) {
      const errorResponse = { error: 'Invalid request format. "messages" must be provided.' };
      logger.error(`app/api/chat/route.ts - Request body validation failed: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const sanitizedMessages = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
      .join('\n');

    const prompt = `${systemPrompt}\n\n${sanitizedMessages}\nAssistant:`;

    if (!prompt || prompt.trim() === '') {
      const errorResponse = { error: 'The constructed prompt is empty.' };
      logger.error(`app/api/chat/route.ts - Prompt validation failed: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    logger.debug(`app/api/chat/route.ts - Constructed prompt: ${prompt}`);

    const handledText: string[] = [];
    const promises: Promise<void>[] = [];

    const modelHandlers = [
      {
        name: 'Amazon Bedrock Titan',
        handler: handleTextWithAmazonBedrockTitanTextModel,
        textModelKey: 'amazonBedrockTitanTextModel',
        shouldWarn: () => !validateEnvVars(['AMAZON_BEDROCK_TITAN_TEXT_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT']),
      },
      {
        name: 'Azure OpenAI O1',
        handler: handleTextWithAzureOpenAIO1TextModel,
        textModelKey: 'azureOpenAIO1TextModel',
        shouldWarn: () => !validateEnvVars(['AZURE_OPENAI_O1_TEXT_MODEL', 'AZURE_OPENAI_O1_ENDPOINT', 'AZURE_OPENAI_O1_API_KEY']),
      },
      {
        name: 'Google Vertex Gemini',
        handler: handleTextWithGoogleVertexGeminiTextModel,
        textModelKey: 'googleVertexGeminiTextModel',
        shouldWarn: () => !validateEnvVars(['GOOGLE_VERTEX_GEMINI_TEXT_MODEL', 'GOOGLE_VERTEX_GEMINI_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_PROJECT']),
      },
      {
        name: 'Ollama Gemma',
        handler: handleTextWithOllamaGemmaTextModel,
        textModelKey: 'ollamaGemmaTextModel',
        shouldWarn: () => !validateEnvVars(['OLLAMA_GEMMA_ENDPOINT', 'OLLAMA_GEMMA_TEXT_MODEL']),
      },
      {
        name: 'Ollama Llama',
        handler: handleTextWithOllamaLlamaTextModel,
        textModelKey: 'ollamaLlamaTextModel',
        shouldWarn: () => !validateEnvVars(['OLLAMA_LLAMA_ENDPOINT', 'OLLAMA_LLAMA_TEXT_MODEL']),
      },
      {
        name: 'OpenAIO1',
        handler: handleTextWithOpenAIO1TextModel,
        textModelKey: 'openAIO1TextModel',
        shouldWarn: () => !validateEnvVars(['OPENAI_O1_TEXT_MODEL', 'OPENAI_O1_API_KEY']),
      },
    ];

    for (const { name, handler, shouldWarn, textModelKey } of modelHandlers) {
      logger.silly(`app/api/chat/route.ts - Checking environment variables for ${name}`);
      if (shouldWarn()) {
        if (!warnings[name]) {
          logger.silly(`app/api/chat/route.ts - Optional environment variables for ${name} are missing or contain placeholders.`);
          warnings[name] = true;
        }
        continue;
      }

      logger.debug(`app/api/chat/route.ts - Invoking handler for ${name}`);
      const textModel = config[textModelKey]; // Directly access the configuration key
      logger.debug(`app/api/chat/route.ts - Prompt: ${prompt}, Text Model: ${textModel || 'Not Found'}`);

      promises.push(
        handler({ prompt, textModel }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`app/api/chat/route.ts - ${name} response: ${result}`);
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - ${name} model failed: ${error.message}`))
      );
    }

    await Promise.allSettled(promises);

    if (handledText.length > 0) {
      logger.info(`app/api/chat/route.ts - Aggregated handledText: ${handledText.join('\n')}`);
      return NextResponse.json({
        message: handledText.join('\n'),
      });
    } else {
      const errorResponse = { error: 'No valid responses from any model.' };
      logger.error(`app/api/chat/route.ts - No responses aggregated: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
  } catch (error: any) {
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Internal Server Error';
    logger.error(`app/api/chat/route.ts - Error in POST /api/chat: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
