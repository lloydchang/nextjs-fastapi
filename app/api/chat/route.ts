// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithAmazonBedrockTitan } from './handlers/handleAmazonBedrockTitan';
import { handleTextWithGoogleVertexGeminiModel } from './handlers/handleGoogleVertexGemini';
import { handleTextWithOllamaGemmaModel } from './handlers/handleOllamaGemma';
import { handleTextWithOllamaLlamaModel } from './handlers/handleOllamaLlama';
import { handleTextWithAzureOpenAIO1Model } from './handlers/handleAzureOpenAIO1';
import { handleTextWithOpenAIO1Model } from './handlers/handleOpenAIO1';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/log';
import { validateEnvVars } from './utils/validate';

const config = getConfig();

let hasWarnedAmazonBedrockTitan = false;
let hasWarnedGoogleVertexGemini = false;
let hasWarnedOllamaGemma = false;
let hasWarnedOllamaLlama = false;
let hasWarnedAzureOpenAIO1 = false;
let hasWarnedOpenAIO1 = false;

export async function POST(request: NextRequest) {
  try {
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

    const handledText: string[] = [];
    const promises: { name: string, promise: Promise<void> }[] = [];

    // Amazon Bedrock Titan Handler
    const amazonBedrockTitanOptionalVars = ['AMAZON_BEDROCK_TITAN_TEXT_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT'];
    const isAmazonBedrockTitanValid = validateEnvVars(amazonBedrockTitanOptionalVars);
    
    if (isAmazonBedrockTitanValid) {
      promises.push({
        name: 'Amazon Bedrock Titan',
        promise: handleTextWithAmazonBedrockTitan({ prompt, model: config.amazonBedrockTitanModel }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`app/api/chat/route.ts - Amazon Bedrock Titan response: ${result}`);
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - Amazon Bedrock Titan model failed: ${error.message}`))
      });
    } else {
      if (!isAmazonBedrockTitanValid && !hasWarnedAmazonBedrockTitan) {
        logger.silly(`app/api/chat/route.ts - Optional environment variables for Amazon Bedrock Titan are missing or contain placeholders: ${amazonBedrockTitanOptionalVars.join(', ')}`);
        hasWarnedAmazonBedrockTitan = true;
      }
    }

    // Google Vertex Gemini Handler
    const googleVertexGeminiOptionalVars = [
      'GOOGLE_VERTEX_GEMINI_TEXT_MODEL',
      'GOOGLE_VERTEX_GEMINI_LOCATION',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'GOOGLE_CLOUD_PROJECT',
    ];
    const isGoogleVertexGeminiValid = validateEnvVars(googleVertexGeminiOptionalVars);
    
    if (isGoogleVertexGeminiValid) {
      promises.push({
        name: 'Google Vertex Gemini',
        promise: handleTextWithGoogleVertexGeminiModel({ prompt, model: config.googleVertexGeminiModel, temperature: config.googleVertexGeminiTemperature }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`app/api/chat/route.ts - Google Vertex Gemini response: ${result}`);
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - Google Vertex Gemini model failed: ${error.message}`))
      });
    } else {
      if (!isGoogleVertexGeminiValid && !hasWarnedGoogleVertexGemini) {
        logger.silly(`app/api/chat/route.ts - Optional environment variables for Google Vertex Gemini are missing or contain placeholders: ${googleVertexGeminiOptionalVars.join(', ')}`);
        hasWarnedGoogleVertexGemini = true;
      }
    }

    // Ollama Gemma Handler
    const ollamaGemmaVars = ['OLLAMA_GEMMA_ENDPOINT', 'OLLAMA_GEMMA_TEXT_MODEL'];
    const isOllamaGemmaValid = validateEnvVars(ollamaGemmaVars);
    
    if (isOllamaGemmaValid) {
      promises.push({
        name: 'Ollama Gemma',
        promise: handleTextWithOllamaGemmaModel({ prompt, model: config.ollamaGemmaModel }, config)
          .then(async (result) => {
            if (result instanceof Response) {
              const responseData = await result.json();
              const textContent = responseData.response || JSON.stringify(responseData);
              handledText.push(textContent);
              logger.info(`app/api/chat/route.ts - Ollama Gemma response: ${textContent}`);
            } else if (typeof result === 'string') {
              handledText.push(result);
              logger.info(`app/api/chat/route.ts - Ollama Gemma response: ${result}`);
            } else {
              logger.warn(`app/api/chat/route.ts - Ollama Gemma returned unexpected type: ${typeof result}`);
            }
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - Ollama Gemma model failed: ${error.message}`))
      });
    } else {
      if (!isOllamaGemmaValid && !hasWarnedOllamaGemma) {
        logger.silly(`app/api/chat/route.ts - Optional environment variables for Ollama Gemma are missing or contain placeholders: ${ollamaGemmaVars.join(', ')}`);
        hasWarnedOllamaGemma = true;
      }
    }

    // Ollama Llama Handler
    const ollamaLlamaVars = ['OLLAMA_LLAMA_ENDPOINT', 'OLLAMA_LLAMA_TEXT_MODEL'];
    const isOllamaLlamaValid = validateEnvVars(ollamaLlamaVars);
    
    if (isOllamaLlamaValid) {
      promises.push({
        name: 'Ollama Llama',
        promise: handleTextWithOllamaLlamaModel({ prompt, model: config.ollamaLlamaModel }, config)
          .then(async (result) => {
            if (result instanceof Response) {
              const responseData = await result.json();
              const textContent = responseData.response || JSON.stringify(responseData);
              handledText.push(textContent);
              logger.info(`app/api/chat/route.ts - Ollama Llama response: ${textContent}`);
            } else if (typeof result === 'string') {
              handledText.push(result);
              logger.info(`app/api/chat/route.ts - Ollama Llama response: ${result}`);
            } else {
              logger.warn(`app/api/chat/route.ts - Ollama Llama returned unexpected type: ${typeof result}`);
            }
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - Ollama Llama model failed: ${error.message}`))
      });
    } else {
      if (!isOllamaLlamaValid && !hasWarnedOllamaLlama) {
        logger.silly(`app/api/chat/route.ts - Optional environment variables for Ollama Llama are missing or contain placeholders: ${ollamaLlamaVars.join(', ')}`);
        hasWarnedOllamaLlama = true;
      }
    }

    // AzureOpenAIO1 Handler
    const azureOpenAIO1Vars = ['AZURE_OPENAI_O1_TEXT_MODEL', 'AZURE_OPENAI_O1_ENDPOINT', 'AZURE_OPENAI_O1_API_KEY'];
    const isAzureOpenAIO1Valid = validateEnvVars(azureOpenAIO1Vars);
    
    if (isAzureOpenAIO1Valid) {
      promises.push({
        name: 'AzureOpenAIO1',
        promise: handleTextWithAzureOpenAIO1Model({ prompt, model: config.azureOpenAIO1Model }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`app/api/chat/route.ts - AzureOpenAIO1 response: ${result}`);
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - AzureOpenAIO1 model failed: ${error.message}`))
      });
    } else {
      if (!isAzureOpenAIO1Valid && !hasWarnedAzureOpenAIO1) {
        logger.silly(`app/api/chat/route.ts - Optional environment variables for AzureOpenAIO1 are missing or contain placeholders: ${azureOpenAIO1Vars.join(', ')}`);
        hasWarnedAzureOpenAIO1 = true;
      }
    }

    // OpenAIO1 Handler
    const openAIO1Vars = ['OPENAI_O1_TEXT_MODEL', 'OPENAI_O1_API_KEY'];
    const isOpenAIO1Valid = validateEnvVars(openAIO1Vars);
    
    if (isOpenAIO1Valid) {
      promises.push({
        name: 'OpenAIO1',
        promise: handleTextWithOpenAIO1Model({ prompt, model: config.openAIO1Model }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`app/api/chat/route.ts - OpenAIO1 response: ${result}`);
          })
          .catch(error => logger.warn(`app/api/chat/route.ts - OpenAIO1 model failed: ${error.message}`))
      });
    } else {
      if (!isOpenAIO1Valid && !hasWarnedOpenAIO1) {
        logger.silly(`app/api/chat/route.ts - Optional environment variables for OpenAIO1 are missing or contain placeholders: ${openAIO1Vars.join(', ')}`);
        hasWarnedOpenAIO1 = true;
      }
    }

    const results = await Promise.allSettled(promises.map(p => p.promise));

    results.forEach((result, index) => {
      const modelName = promises[index].name;
      if (result.status === 'fulfilled') {
        logger.info(`app/api/chat/route.ts - Fulfilled attempt to ${modelName}.`);
      } else {
        logger.error(`app/api/chat/route.ts - Failed attempt to ${modelName}: ${result.reason}`);
      }
    });

    logger.info(`app/api/chat/route.ts - Aggregated handledText: ${handledText.join('\n')}`);

    if (handledText.length > 0) {
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
