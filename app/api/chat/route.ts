// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from './utils/validateEnv';
import { getConfig } from './utils/config';
import { generateTextWithPrimaryModel } from './handlers/generatePrimary';
import { generateTextWithFallbackModel } from './handlers/generateFallback';
import { streamResponseWithLogs, sendCompleteResponse } from './handlers/handleResponse';
import { streamErrorMessage, returnErrorResponse } from './handlers/handleErrors';
import { sanitizeInput } from './utils/stringUtils';
import { systemPrompt } from './utils/systemPrompt';
import { requiredEnvVars, validateAndLogEnvVars } from './utils/envUtils';
import logger from './utils/logger';
import { generateFromGoogleVertexAI } from './services/google-vertex-ai';
import { generateFromOllamaLLaMA } from './services/ollama-llama';
import { handleRateLimit } from './handlers/rateLimitHandler';

validateEnv();

const config = getConfig();

export async function POST(request: NextRequest) {
  let generatedText = '';

  try {
    // Handle rate limiting
    const rateLimitResult = await handleRateLimit(request, config);
    if (rateLimitResult) return rateLimitResult;

    const { input, context } = await request.json();
    if (typeof input !== 'string') {
      logger.error('Invalid input format: "input" must be a string.');
      return streamErrorMessage('Invalid input format. "input" must be a string.', [], config);
    }

    const sanitizedInput = sanitizeInput(input);
    logger.info(`Sanitized input: ${sanitizedInput}`);

    const prompt = context
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`
      : `${systemPrompt}\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`;

    const requestBody = { model: config.primaryModel, prompt: prompt, temperature: config.temperature };

    if (!validateAndLogEnvVars(requiredEnvVars, [])) {
      logger.warn('Skipping primary model due to invalid environment configuration.');
    } else {
      try {
        generatedText = await generateTextWithPrimaryModel(requestBody, config, []);
      } catch (primaryError) {
        logger.error(`Primary model failed: ${primaryError.message}`);
      }
    }

    if (config.fallbackModel && config.llamaEndpoint) {
      try {
        generatedText = await generateTextWithFallbackModel(requestBody.prompt, config, []);
      } catch (fallbackError) {
        logger.error(`Fallback model failed: ${fallbackError.message}`);
        return returnErrorResponse(`${fallbackError.message}`, 500, [], config);
      }
    } else {
      return returnErrorResponse('No fallback is configured.', 500, [], config);
    }

    return config.streamEnabled
      ? streamResponseWithLogs(generatedText, [], context, config)
      : sendCompleteResponse(generatedText, [], context, config);
  } catch (error) {
    logger.error(`Internal Server Error: ${error.message}`);
    return returnErrorResponse('Internal Server Error', 500, [], config);
  }
}
