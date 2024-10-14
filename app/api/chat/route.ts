// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat//controllers/OllamaGemmaController';
import { logger } from 'app/api/chat/utils/logger';
import { validateEnvVars } from 'app/api/chat/utils/validate';
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
 * Checks if a configuration value is valid.
 * @param value - The configuration value.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidConfig(value: any): boolean {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    value.trim().toLowerCase() !== 'undefined' &&
    value.trim().toLowerCase() !== 'null'
  );
}

// Cleanup mechanism to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  // Cleanup inactive clients
  for (const [clientId, lastActivity] of lastActivityMap.entries()) {
    if (now - lastActivity > INACTIVITY_LIMIT) {
      clientPrompts.delete(clientId);
      clientMutexes.delete(clientId);
      lastActivityMap.delete(clientId);
      logger.info(`Cleaned up prompt and mutex for inactive clientId: ${clientId}`);
    }
  }

  // Cleanup rate limit entries
  for (const [clientId, rateInfo] of rateLimitMap.entries()) {
    if (now - rateInfo.firstRequestTime > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(clientId);
    }
  }
}, 60 * 1000); // Runs every minute

/**
 * Main POST handler for the chat API.
 * Manages rate limiting, concurrency, prompt management, and streaming responses.
 * @param request - Incoming HTTP request.
 * @returns {Promise<NextResponse>} - Streamed response or JSON error.
 */
export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  logger.info(`Received POST request [${requestId}] from clientId: ${clientId}`);

  // Implement Server-Side Rate Limiting
  const now = Date.now();
  const rateInfo = rateLimitMap.get(clientId);

  if (rateInfo) {
    if (now - rateInfo.firstRequestTime < RATE_LIMIT_WINDOW) {
      // Within the rate limit window
      if (rateInfo.count >= RATE_LIMIT) {
        // Exceeded rate limit
        logger.warn(`ClientId: ${clientId} has exceeded the rate limit.`);
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `You have exceeded the limit of ${RATE_LIMIT} requests per minute. Please try again later.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': `${Math.ceil((RATE_LIMIT_WINDOW - (now - rateInfo.firstRequestTime)) / 1000)}`, // In seconds
            },
          }
        );
      } else {
        // Increment the request count
        rateInfo.count += 1;
        rateLimitMap.set(clientId, rateInfo);
      }
    } else {
      // Rate limit window has passed, reset the count
      rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
    }
  } else {
    // First request from this client
    rateLimitMap.set(clientId, { count: 1, firstRequestTime: now });
  }

  // Get or create a mutex for the client
  let mutex = clientMutexes.get(clientId);
  if (!mutex) {
    mutex = new Mutex();
    clientMutexes.set(clientId, mutex);
  }

  // Acquire the mutex before processing
  return mutex.runExclusive(async () => {
    // Update last activity timestamp
    lastActivityMap.set(clientId, Date.now());

    try {
      const { userPrompt } = await request.json();
      if (typeof userPrompt !== 'string' || userPrompt.trim() === '') {
        logger.warn(`Request [${requestId}] from clientId: ${clientId} has invalid format or no userPrompt.`);
        return NextResponse.json(
          { error: 'Invalid request format or no userPrompt provided.' },
          { status: 400 }
        );
      }

      // Retrieve the existing prompt or initialize it with system prompt
      let prompt = clientPrompts.get(clientId) || config.systemPrompt;
      logger.debug(`Current prompt for clientId: ${clientId}: ${prompt}`);

      // Append the new user prompt
      prompt += `\n\nUser: ${userPrompt}`;
      logger.debug(`Updated prompt for clientId: ${clientId}: ${prompt}`);

      // Manage prompt length (truncation or summarization)
      prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, config.ollamaGemmaEndpoint, config.ollamaGemmaTextModel);
      logger.debug(`Managed prompt for clientId: ${clientId}: ${prompt}`);

      // Update the prompt in the map
      clientPrompts.set(clientId, prompt);

      // Send the prompt to Ollama Gemma and handle the response
      const response = await handleTextWithOllamaGemmaTextModel({
        userPrompt: prompt,
        textModel: config.ollamaGemmaTextModel!,
      }, config);

      if (response) {
        const botPersona = 'Ollama ' + config.ollamaGemmaTextModel!;
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(
              `data: ${JSON.stringify({ persona: botPersona, message: response })}\n\n`
            );

            logger.info(`Generated response for clientId: ${clientId}: ${response}`);

            // Append the assistant's response to maintain context
            prompt += `\n\nAssistant: ${response}`;
            clientPrompts.set(clientId, prompt);

            controller.enqueue('data: [DONE]\n\n');
            controller.close();
          },
        });

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      } else {
        logger.error(`handleTextWithOllamaGemmaTextModel returned null for clientId: ${clientId}.`);
        return NextResponse.json(
          { error: 'Failed to generate text from Ollama Gemma.' },
          { status: 500 }
        );
      }
    } catch (error) {
      logger.error(
        `route.ts [${requestId}] - Error in streaming bot interaction: ${error}`
      );

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
