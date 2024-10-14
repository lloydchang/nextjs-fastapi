// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { logger } from 'app/api/chat/utils/logger';
import { Mutex } from 'async-mutex';
import { managePrompt } from 'app/api/chat/utils/promptManager';

const config = getConfig();

const MAX_PROMPT_LENGTH = 4000; // Adjust based on Ollama Gemma's token limit

// Rate Limiting Configuration
const RATE_LIMIT = 5; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Maps to track client prompts and mutexes
const clientPrompts = new Map<string, string>();
const clientMutexes = new Map<string, Mutex>();

// Map to track rate limiting per client
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

// Optional: To track last activity for cleanup
const lastActivityMap = new Map<string, number>();
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Main POST handler for the chat API.
 */
export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  logger.info(`Received POST request [${requestId}] from clientId: ${clientId}`);

  const now = Date.now();
  const rateInfo = rateLimitMap.get(clientId);

  // Handle rate limiting
  if (rateInfo) {
    if (now - rateInfo.firstRequestTime < RATE_LIMIT_WINDOW) {
      if (rateInfo.count >= RATE_LIMIT) {
        logger.warn(`ClientId: ${clientId} has exceeded the rate limit.`);
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `You have exceeded the limit of ${RATE_LIMIT} requests per minute. Please try again later.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': `${Math.ceil((RATE_LIMIT_WINDOW - (now - rateInfo.firstRequestTime)) / 1000)}`,
            },
          }
        );
      } else {
        rateInfo.count += 1;
        rateLimitMap.set(clientId, rateInfo);
      }
    } else {
      rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
    }
  } else {
    rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
  }

  let mutex = clientMutexes.get(clientId);
  if (!mutex) {
    mutex = new Mutex();
    clientMutexes.set(clientId, mutex);
  }

  return mutex.runExclusive(async () => {
    lastActivityMap.set(clientId, Date.now());

    try {
      const { userPrompt } = await request.json();
      if (typeof userPrompt !== 'string' || userPrompt.trim() === '') {
        logger.warn(`Request [${requestId}] from clientId: ${clientId} has invalid format or no userPrompt.`);
        return NextResponse.json({ error: 'Invalid request format or no userPrompt provided.' }, { status: 400 });
      }

      let prompt = clientPrompts.get(clientId) || config.systemPrompt;
      logger.debug(`Current prompt for clientId: ${clientId}: ${prompt}`);

      prompt += `\n\nUser: ${userPrompt}`;
      logger.debug(`Updated prompt for clientId: ${clientId}: ${prompt}`);

      // Check if ollamaGemmaEndpoint is defined
      const ollamaGemmaEndpoint = config.ollamaGemmaEndpoint || "defaultEndpoint"; 

      // Provide a default value for ollamaGemmaTextModel or throw an error if undefined
      const ollamaGemmaTextModel = config.ollamaGemmaTextModel || "defaultModel"; 

      if (ollamaGemmaTextModel === "defaultModel") {
        logger.error(`Ollama Gemma text model is not defined for clientId: ${clientId}`);
        return NextResponse.json({ error: 'Ollama Gemma text model is not configured.' }, { status: 500 });
      }

      prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, ollamaGemmaEndpoint, ollamaGemmaTextModel) || "defaultPrompt";
      logger.debug(`Managed prompt for clientId: ${clientId}: ${prompt}`);

      clientPrompts.set(clientId, prompt);

      try {
        // Existing logic (ollamaGemmaTextModel is now guaranteed to be a string)
        const response = await handleTextWithOllamaGemmaTextModel(ollamaGemmaTextModel, clientId);
        if (response) {
          return NextResponse.json(response, { status: 200 });
        } else {
          logger.error(`handleTextWithOllamaGemmaTextModel returned null for clientId: ${clientId}.`);
          return NextResponse.json({ error: 'Failed to generate text from Ollama Gemma.' }, { status: 500 });
        }
      } catch (error) {
        logger.error(`route.ts [${requestId}] - Error in streaming bot interaction: ${error}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    } catch (error) {
      logger.error(`route.ts [${requestId}] - Error in streaming bot interaction: ${error}`);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
