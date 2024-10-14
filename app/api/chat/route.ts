// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaController';
// ... other imports

import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import logger from 'app/api/chat/utils/logger';
import { validateEnvVars } from 'app/api/chat/utils/validate';
import { Mutex } from 'async-mutex';

const config = getConfig();

const maxTotalContextMessages = 10; // Adjust as needed
const maxBotResponsesInContext = 1;

const clientContexts = new Map<string, any[]>();
const clientMutexes = new Map<string, Mutex>();

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
  for (const [clientId, lastActivity] of lastActivityMap.entries()) {
    if (now - lastActivity > INACTIVITY_LIMIT) {
      clientContexts.delete(clientId);
      clientMutexes.delete(clientId);
      lastActivityMap.delete(clientId);
      logger.info(`Cleaned up context and mutex for inactive clientId: ${clientId}`);
    }
  }
}, INACTIVITY_LIMIT);

// Main POST handler
export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

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

      // Retrieve the existing context or initialize it
      let context = clientContexts.get(clientId) || [];

      // Append new messages to the context
      context = [...context, ...messages.map(msg => ({ ...msg, role: 'user' }))];

      // Ensure the context doesn't exceed the maximum allowed messages
      context = context.slice(-maxTotalContextMessages);

      // Update the context in the map
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          interface BotFunction {
            persona: string;
            generate: (currentContext: any[]) => Promise<string>;
          }

          const botFunctions: BotFunction[] = [];

          // Add your bot functions here
          if (
            isValidConfig(config.ollamaGemmaTextModel) &&
            validateEnvVars(['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'])
          ) {
            botFunctions.push({
              persona: 'Ollama ' + config.ollamaGemmaTextModel!,
              generate: (currentContext: any[]) =>
                handleTextWithOllamaGemmaTextModel(
                  {
                    userPrompt: extractValidMessages(currentContext),
                    textModel: config.ollamaGemmaTextModel!,
                  },
                  config
                ),
            });
          }

          // Add other bot functions as needed...

          // Process bots sequentially and stop after one response
          async function processBots() {
            let hasResponded = false;

            for (const bot of botFunctions) {
              if (hasResponded) break;

              // Create a new context considering only up to the latest user message
              const lastUserMessageIndex = context.slice().reverse().findIndex(msg => msg.role === 'user');
              if (lastUserMessageIndex === -1) {
                // No user message found; skip processing
                continue;
              }

              // Calculate the index of the latest user message in the original context
              const latestUserMessageIndex = context.length - 1 - lastUserMessageIndex;

              // Build the context up to and including the latest user message
              const botContext = context.slice(0, latestUserMessageIndex + 1);

              const response = await bot.generate(botContext);

              if (response && typeof response === 'string') {
                const botPersona = bot.persona;

                logger.debug(
                  `app/api/chat/route.ts [${requestId}] - Response from ${botPersona}: ${response}`
                );

                controller.enqueue(
                  `data: ${JSON.stringify({
                    persona: botPersona,
                    message: response,
                  })}\n\n`
                );

                const botMessage = {
                  role: 'bot',
                  content: response,
                  persona: botPersona,
                };

                context.push(botMessage);

                // Limit the number of bot messages in the context
                const botMessages = context.filter(msg => msg.role === 'bot');
                if (botMessages.length > maxBotResponsesInContext) {
                  const indexToRemove = context.findIndex(msg => msg.role === 'bot');
                  context.splice(indexToRemove, 1);
                }

                // Ensure we don't exceed the total context size
                context = context.slice(-maxTotalContextMessages);

                hasResponded = true;
                break; // Stop processing other bots
              }
            }

            clientContexts.set(clientId, context);

            if (!hasResponded) {
              logger.silly(
                `app/api/chat/route.ts [${requestId}] - No bot responded. Ending interaction.`
              );
            }

            controller.enqueue('data: [DONE]\n\n');
            controller.close();
          }

          await processBots();
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
        `app/api/chat/route.ts [${requestId}] - Error in streaming bot interaction: ${error}`
      );

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
