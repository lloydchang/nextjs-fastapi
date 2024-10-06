// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithAmazonBedrockTitan } from './controllers/AmazonBedrockTitanController';
import { handleTextWithAzureOpenAIO1Model } from './controllers/AzureOpenAIO1Controller';
import { handleTextWithGoogleVertexGeminiModel } from './controllers/GoogleVertexGeminiController';
import { handleTextWithOllamaGemmaModel } from './controllers/OllamaGemmaController';
import { handleTextWithOllamaLlamaModel } from './controllers/OllamaLlamaController';
import { handleTextWithOpenAIO1Model } from './controllers/OpenAIO1Controller';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/log';
import { validateEnvVars } from './utils/validate';

const config = getConfig();

let warnings = {
  AmazonBedrockTitan: false,
  AzureOpenAIO1: false,
  GoogleVertexGemini: false,
  OllamaGemma: false,
  OllamaLlama: false,
  OpenAIO1: false,
};

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    logger.debug(`Received request body: ${JSON.stringify(requestBody)}`);
    
    const { messages } = requestBody;

    if (!Array.isArray(messages)) {
      const errorResponse = { error: 'Invalid request format. "messages" must be provided.' };
      logger.error(`Request body validation failed: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const sanitizedMessages = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
      .join('\n');
      
    const prompt = `${systemPrompt}\n\n${sanitizedMessages}\nAssistant:`;

    if (!prompt || prompt.trim() === '') {
      const errorResponse = { error: 'The constructed prompt is empty.' };
      logger.error(`Prompt validation failed: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const handledText: string[] = [];
    const promises: Promise<void>[] = [];

    const modelHandlers = [
      {
        name: 'Amazon Bedrock Titan',
        handler: handleTextWithAmazonBedrockTitan,
        vars: ['AMAZON_BEDROCK_TITAN_TEXT_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT'],
        shouldWarn: () => !validateEnvVars(['AMAZON_BEDROCK_TITAN_TEXT_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT']),
      },
      {
        name: 'Azure OpenAI O1',
        handler: handleTextWithAzureOpenAIO1Model,
        vars: ['AZURE_OPENAI_O1_TEXT_MODEL', 'AZURE_OPENAI_O1_ENDPOINT', 'AZURE_OPENAI_O1_API_KEY'],
        shouldWarn: () => !validateEnvVars(['AZURE_OPENAI_O1_TEXT_MODEL', 'AZURE_OPENAI_O1_ENDPOINT', 'AZURE_OPENAI_O1_API_KEY']),
      },
      {
        name: 'Google Vertex Gemini',
        handler: handleTextWithGoogleVertexGeminiModel,
        vars: ['GOOGLE_VERTEX_GEMINI_TEXT_MODEL', 'GOOGLE_VERTEX_GEMINI_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_PROJECT'],
        shouldWarn: () => !validateEnvVars(['GOOGLE_VERTEX_GEMINI_TEXT_MODEL', 'GOOGLE_VERTEX_GEMINI_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_PROJECT']),
      },
      {
        name: 'Ollama Gemma',
        handler: handleTextWithOllamaGemmaModel,
        vars: ['OLLAMA_GEMMA_ENDPOINT', 'OLLAMA_GEMMA_TEXT_MODEL'],
        shouldWarn: () => !validateEnvVars(['OLLAMA_GEMMA_ENDPOINT', 'OLLAMA_GEMMA_TEXT_MODEL']),
      },
      {
        name: 'Ollama Llama',
        handler: handleTextWithOllamaLlamaModel,
        vars: ['OLLAMA_LLAMA_ENDPOINT', 'OLLAMA_LLAMA_TEXT_MODEL'],
        shouldWarn: () => !validateEnvVars(['OLLAMA_LLAMA_ENDPOINT', 'OLLAMA_LLAMA_TEXT_MODEL']),
      },
      {
        name: 'OpenAIO1',
        handler: handleTextWithOpenAIO1Model,
        vars: ['OPENAI_O1_TEXT_MODEL', 'OPENAI_O1_API_KEY'],
        shouldWarn: () => !validateEnvVars(['OPENAI_O1_TEXT_MODEL', 'OPENAI_O1_API_KEY']),
      },
    ];

    for (const { name, handler, vars, shouldWarn } of modelHandlers) {
      if (shouldWarn()) {
        if (!warnings[name]) {
          logger.silly(`Optional environment variables for ${name} are missing or contain placeholders: ${vars.join(', ')}`);
          warnings[name] = true;
        }
        continue;
      }
      
      promises.push(
        handler({ prompt, model: config[`${name.replace(/\s+/g, '')}Model`] }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`${name} response: ${result}`);
          })
          .catch(error => logger.warn(`${name} model failed: ${error.message}`))
      );
    }

    await Promise.allSettled(promises);

    if (handledText.length > 0) {
      logger.info(`Aggregated handledText: ${handledText.join('\n')}`);
      return NextResponse.json({
        message: handledText.join('\n'),
      });
    } else {
      const errorResponse = { error: 'No valid responses from any model.' };
      logger.error(`No responses aggregated: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
  } catch (error: any) {
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Internal Server Error';
    logger.error(`Error in POST /api/chat: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
