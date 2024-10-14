// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import logger from 'app/api/chat/utils/logger';
import { validateEnvVars } from 'app/api/chat/utils/validate';
import { Mutex } from 'async-mutex';

const config = getConfig();

const maxTotalContextMessages = 10; // Adjust as needed
const maxBotResponsesInContext = 1;

// Rate Limiting Configuration
const RATE_LIMIT = 5; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Maps to track client contexts and mutexes
const clientContexts = new Map<string, any[]>();
const clientMutexes = new Map<string, Mutex>();

// Map to track rate limiting per client
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

// Optional: To track last activity for cleanup
const lastActivityMap = new Map<string, number>();
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in milliseconds

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
      clientContexts.delete(clientId);
      clientMutexes.delete(clientId);
      lastActivityMap.delete(clientId);
      logger.info(`Cleaned up context and mutex for inactive clientId: ${clientId}`);
    }
  }

  // Cleanup rate limit entries
  for (const [clientId, rateInfo] of rateLimitMap.entries()) {
    if (now - rateInfo.firstRequestTime > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(clientId);
    }
  }
}, 60 * 1000); // Runs every minute

// Main POST handler
export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

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
      const { messages } = await request.json();
      if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request format or no messages provided.' },
          { status: 400 }
        );
      }

      // Retrieve the existing context or initialize it with system prompt
      let context = clientContexts.get(clientId) || [];
      if (context.length === 0) {
        // Initialize with system prompt
        context = [{ role: 'system', content: config.systemPrompt }];
      }

      // Append new user messages to the context
      const userMessages = messages.map(msg => ({ role: 'user', content: msg.content }));
      context = [...context, ...userMessages];

      // Ensure the context doesn't exceed the maximum allowed messages
      context = context.slice(-maxTotalContextMessages);

      // Update the context in the map
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          // Prepare structured messages with explicit roles
          const structuredMessages = [
            { role: 'system', content: config.systemPrompt }, // Ensure system prompt is always first
            ...context.filter(msg => msg.role !== 'system'), // Exclude additional system prompts
          ];

          const textModel = config.ollamaGemmaTextModel;

          if (isValidConfig(textModel) && validateEnvVars(['OLLAMA_GEMMA_ENDPOINT'])) {
            const response = await handleTextWithOllamaGemmaTextModel({
              messages: structuredMessages,
              model: textModel,
            }, config);

            if (response) {
              const botPersona = 'Ollama ' + textModel;
              controller.enqueue(
                `data: ${JSON.stringify({ persona: botPersona, message: response })}\n\n`
              );

              // Update context with bot response
              const botMessage = {
                role: 'assistant', // Use 'assistant' to align with structured messaging
                content: response,
                persona: botPersona,
              };
              context.push(botMessage);

              // Limit the number of assistant messages in the context
              const assistantMessages = context.filter(msg => msg.role === 'assistant');
              if (assistantMessages.length > maxBotResponsesInContext) {
                const indexToRemove = context.findIndex(msg => msg.role === 'assistant');
                if (indexToRemove !== -1) context.splice(indexToRemove, 1);
              }

              // Ensure we don't exceed the total context size
              context = context.slice(-maxTotalContextMessages);

              // Update context in the map
              clientContexts.set(clientId, context);
            }
          }

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
