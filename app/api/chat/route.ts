// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateEnv, optionalVars as optionalEnvVars, validateAndLogEnvVars } from './utils/validate';
import { getConfig } from './utils/config';
import { handleTextWithAmazonBedrockTitan } from './handlers/handleAmazonBedrockTitan';
import { handleTextWithGoogleVertexGemmaModel } from './handlers/handleGoogleVertexGemma';
import { handleTextWithOllamaGemmaModel } from './handlers/handleOllamaGemma';
import { handleTextWithOllamaLlamaModel } from './handlers/handleOllamaLlama';
import { streamResponseWithLogs, sendCompleteResponse } from './handlers/handleResponse';
import { streamErrorMessage, returnErrorResponse } from './handlers/handleError';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/log';
import { handleRateLimit } from './handlers/handleRateLimit';

validateEnv();

const config = getConfig();

export async function POST(request: NextRequest) {
  let handledText: string[] = [];

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

    const promises = [];

    if (config.amazonBedrockTitanModel && config.amazonBedrockTitanEndpoint) {
      promises.push(
        handleTextWithAmazonBedrockTitan({ prompt, model: config.amazonBedrockTitanModel }, config)
          .then((result) => handledText.push(result))
          .catch((error) => {
            logger.error(`Amazon Bedrock Titan model failed: ${error.message}`);
            handledText.push(`Amazon Bedrock Titan failed: ${error.message}`);
          })
      );
    } else {
      handledText.push('No Amazon Bedrock Titan is configured.');
    }

    if (validateAndLogEnvVars(optionalEnvVars, [])) {
      const requestBody = { model: config.googleVertexGemmaModel, prompt, temperature: config.temperature };
      promises.push(
        handleTextWithGoogleVertexGemmaModel(requestBody, config, [])
          .then((result) => handledText.push(result))
          .catch((error) => {
            logger.error(`GoogleVertexGemma model failed: ${error.message}`);
            handledText.push(`GoogleVertexGemma failed: ${error.message}`);
          })
      );
    }

    if (config.ollamaGemmaModel && config.ollamaGemmaEndpoint) {
      promises.push(
        handleTextWithOllamaGemmaModel(prompt, config, [])
          .then((result) => handledText.push(result))
          .catch((error) => {
            logger.error(`OllamaGemma model failed: ${error.message}`);
            handledText.push(`OllamaGemma failed: ${error.message}`);
          })
      );
    } else {
      handledText.push('No OllamaGemma is configured.');
    }

    if (config.ollamaLLAMAModel && config.ollamaLlamaEndpoint) {
      promises.push(
        handleTextWithOllamaLlamaModel(prompt, config, [])
          .then((result) => handledText.push(result))
          .catch((error) => {
            logger.error(`OllamaLlama model failed: ${error.message}`);
            handledText.push(`OllamaLlama failed: ${error.message}`);
          })
      );
    } else {
      handledText.push('No OllamaLlama is configured.');
    }

    await Promise.allSettled(promises);

    return config.streamEnabled
      ? streamResponseWithLogs(handledText.join('\n'), [], context, config)
      : sendCompleteResponse(handledText.join('\n'), [], context, config);
  } catch (error) {
    logger.error(`Internal Server Error: ${error.message}`);
    return returnErrorResponse('Internal Server Error', 500, [], config);
  }
}
