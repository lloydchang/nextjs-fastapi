// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithAmazonBedrockTitan } from './handlers/handleAmazonBedrockTitan';
import { handleTextWithGoogleVertexGeminiModel } from './handlers/handleGoogleVertexGemini';
import { handleTextWithOllamaGemmaModel } from './handlers/handleOllamaGemma';
import { handleTextWithOllamaLlamaModel } from './handlers/handleOllamaLlama';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/log';
import { validateEnvVars } from './utils/validate'; // Import validateEnvVars function

const config = getConfig();

let hasWarnedAmazonBedrockTitan = false; // Warning flag for Amazon Bedrock Titan
let hasWarnedGoogleVertexGemini = false;   // Warning flag for Google Vertex Gemini
let hasWarnedOllamaGemma = false;    // Warning flag for Ollama Gemma
let hasWarnedOllamaLlama = false;     // Warning flag for Ollama Llama

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  try {
    const requestBody = await request.json();
    logger.info(`Received request body: ${JSON.stringify(requestBody)}`);
    
    const { messages } = requestBody;

    if (!Array.isArray(messages)) {
      const errorResponse = { error: 'Invalid request format. "messages" must be provided.' };
      logger.error(`Request body validation failed: ${JSON.stringify(errorResponse)}`);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Construct prompt
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
    const promises: { name: string, promise: Promise<void> }[] = [];

    // Amazon Bedrock Titan Handler
    const amazonBedrockTitanOptionalVars = ['AMAZON_BEDROCK_TITAN_MODEL', 'AMAZON_BEDROCK_TITAN_ENDPOINT'];
    const isAmazonBedrockTitanValid = validateEnvVars(amazonBedrockTitanOptionalVars);
    
    if (isAmazonBedrockTitanValid) {
      promises.push({
        name: 'Amazon Bedrock Titan',
        promise: handleTextWithAmazonBedrockTitan({ prompt, model: config.amazonBedrockTitanModel }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`Amazon Bedrock Titan response: ${result}`);
          })
          .catch(error => logger.warn(`Amazon Bedrock Titan model failed: ${error.message}`))
      });
    } else {
      if (!isAmazonBedrockTitanValid && !hasWarnedAmazonBedrockTitan) {
        logger.debug(`Optional environment variables for Amazon Bedrock Titan are missing or contain placeholders: ${amazonBedrockTitanOptionalVars.join(', ')}`);
        hasWarnedAmazonBedrockTitan = true;
      }
    }

    // Google Vertex Gemini Handler
    const googleVertexGeminiOptionalVars = [
      'GOOGLE_VERTEX_GEMINI_MODEL',
      'GOOGLE_VERTEX_GEMINI_LOCATION',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'GOOGLE_CLOUD_PROJECT',
    ];
    const isGoogleVertexGeminiValid = validateEnvVars(googleVertexGeminiOptionalVars);
    
    if (isGoogleVertexGeminiValid) {
      promises.push({
        name: 'Google Vertex Gemini',
        promise: handleTextWithGoogleVertexGeminiModel({ prompt, model: config.googleVertexGeminiModel, temperature: config.temperature }, config)
          .then(result => {
            handledText.push(result);
            logger.info(`Google Vertex Gemini response: ${result}`);
          })
          .catch(error => logger.warn(`Google Vertex Gemini model failed: ${error.message}`))
      });
    } else {
      if (!isGoogleVertexGeminiValid && !hasWarnedGoogleVertexGemini) {
        logger.debug(`Optional environment variables for Google Vertex Gemini are missing or contain placeholders: ${googleVertexGeminiOptionalVars.join(', ')}`);
        hasWarnedGoogleVertexGemini = true;
      }
    }

    // Ollama Gemma Handler
    const ollamaGemmaVars = ['OLLAMA_GEMMA_ENDPOINT', 'OLLAMA_GEMMA_MODEL'];
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
              logger.info(`Ollama Gemma response: ${textContent}`);
            } else {
              handledText.push(result);
              logger.info(`Ollama Gemma response: ${result}`);
            }
          })
          .catch(error => logger.warn(`Ollama Gemma model failed: ${error.message}`))
      });
    } else {
      if (!isOllamaGemmaValid && !hasWarnedOllamaGemma) {
        logger.debug(`Optional environment variables for Ollama Gemma are missing or contain placeholders: ${ollamaGemmaVars.join(', ')}`);
        hasWarnedOllamaGemma = true;
      }
    }

    // Ollama Llama Handler
    const ollamaLlamaVars = ['OLLAMA_LLAMA_ENDPOINT', 'OLLAMA_LLAMA_MODEL'];
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
              logger.info(`Ollama Llama response: ${textContent}`);
            } else {
              handledText.push(result);
              logger.info(`Ollama Llama response: ${result}`);
            }
          })
          .catch(error => logger.warn(`Ollama Llama model failed: ${error.message}`))
      });
    } else {
      if (!isOllamaLlamaValid && !hasWarnedOllamaLlama) {
        logger.debug(`Optional environment variables for Ollama Llama are missing or contain placeholders: ${ollamaLlamaVars.join(', ')}`);
        hasWarnedOllamaLlama = true;
      }
    }

    // Use Promise.allSettled to handle individual errors without failing the whole process
    const results = await Promise.allSettled(promises.map(p => p.promise));

    results.forEach((result, index) => {
      const modelName = promises[index].name;
      if (result.status === 'fulfilled') {
        // logger.info(`Fulfilled attempt to ${modelName}.`);
      } else {
        logger.error(`Failed attempt to ${modelName}: ${result.reason}`);
      }
    });

    // Return the combined results as the message
    return NextResponse.json({
      message: handledText.join('\n'),
    });
    
  } catch (error: any) {
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Internal Server Error';
    logger.error(`Error in POST /api/chat: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
