// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, AppConfig } from 'app/api/chat/utils/config';
import { checkRateLimit, clearAbortController } from 'app/api/chat/utils/rateLimiter'; // Import rate limiter and clear function
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaController';
import { handleTextWithGoogleVertexGemmaTextModel } from 'app/api/chat/controllers/GoogleVertexGemmaController';
import { handleTextWithOllamaLlamaTextModel } from 'app/api/chat/controllers/OllamaLlamaController';
import { handleTextWithCloudflareLlamaTextModel } from 'app/api/chat/controllers/CloudflareLlamaController';
import { handleTextWithGoogleVertexLlamaTextModel } from 'app/api/chat/controllers/GoogleVertexLlamaController';
import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import logger from 'app/api/chat/utils/logger';
import { validateEnvVars } from 'app/api/chat/utils/validate';
import { Mutex } from 'async-mutex';
import { BotFunction } from 'types'; // Ensure this is correctly exported in 'types'

const config: AppConfig = getConfig();

const MAX_PROMPT_LENGTH = 128000; // Adjust based on token size limit
const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 0; // Keep only the last 0 messages

// Maps to track client-specific data
const clientPrompts = new Map<string, string>();
const clientMutexes = new Map<string, Mutex>();
const lastInteractionTimes = new Map<string, number>();
const clientContexts = new Map<string, any[]>();

/**
 * Helper function to check if a configuration value is valid.
 * @param value - The configuration value to validate.
 * @returns True if valid, else false.
 */
function isValidConfig(value: any): boolean {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    value.trim().toLowerCase() !== 'undefined' &&
    value.trim().toLowerCase() !== 'null'
  );
}

/**
 * Handles POST requests to the chat API.
 * @param request - The incoming NextRequest.
 * @returns A NextResponse containing the streamed bot responses or an error.
 */
export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  // Handle rate limiting
  const { limited, retryAfter, controller } = checkRateLimit(clientId);
  if (limited) {
    logger.warn(`app/api/chat/route.ts - ClientId: ${clientId} has exceeded the rate limit.`);
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `You have exceeded the rate limit. Please try again later.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': `${retryAfter}`,
        },
      }
    );
  }

  let mutex = clientMutexes.get(clientId);
  if (!mutex) {
    mutex = new Mutex();
    clientMutexes.set(clientId, mutex);
  }

  return mutex.runExclusive(async () => {
    lastInteractionTimes.set(clientId, Date.now());

    try {
      const { messages } = await request.json();

      // Filter out invalid messages (e.g., empty content)
      const validMessages = messages.filter(
        (msg: any) => msg.content && typeof msg.content === 'string' && msg.content.trim() !== ''
      );

      if (!Array.isArray(validMessages) || validMessages.length === 0) {
        logger.warn(
          `app/api/chat/route.ts - Request [${requestId}] from clientId: ${clientId} has invalid format or no valid messages.`
        );
        return NextResponse.json(
          { error: 'Invalid request format or no valid messages provided.' },
          { status: 400 }
        );
      }

      // Get or initialize the context for this client
      let context = clientContexts.get(clientId) || [];
      context = [...context, ...validMessages]; // Append new valid messages to the context
      context = context.slice(-maxContextMessages); // Keep context within limits
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          const botFunctions: BotFunction[] = [];

          const addBotFunction = (
            personaPrefix: string,
            textModelConfigKey: keyof AppConfig,
            endpointEnvVars: string[],
            handlerFunction: (input: { userPrompt: string; textModel: string }, config: AppConfig) => Promise<string | null>
          ) => {
            if (isValidConfig(config[textModelConfigKey]) && validateEnvVars(endpointEnvVars)) {
              const textModel = config[textModelConfigKey] || "defaultModel";

              botFunctions.push({
                persona: `${personaPrefix} ${textModel}`,
                valid: isValidConfig(config[textModelConfigKey]),
                generate: async (currentContext: any[]) => {
                  let prompt = config.systemPrompt || '';
                  if (currentContext.length > 0) {
                    prompt += `${extractValidMessages(currentContext)}`;
                  }

                  try {
                    controller.enqueue(
                      `data: ${JSON.stringify({ persona: `${personaPrefix} ${textModel}`, message: prompt })}\n\n`
                    );
                  } catch (enqueueError) {
                    logger.error(`app/api/chat/route.ts - Enqueue error: ${enqueueError}`);
                  }

                  if (context.length > 0 && context[context.length - 1].content !== prompt) {
                    context[context.length - 1] = { ...context[context.length - 1], content: prompt };
                  }
                  clientContexts.set(clientId, context);

                  return handlerFunction({ userPrompt: prompt, textModel }, config);
                },
              });
            }
          };

          // Add bot functions
          addBotFunction(
            'Ollama',
            'ollamaGemmaTextModel',
            ['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'],
            handleTextWithOllamaGemmaTextModel
          );

          addBotFunction(
            'Cloudflare',
            'cloudflareGemmaTextModel',
            ['CLOUDFLARE_GEMMA_TEXT_MODEL', 'CLOUDFLARE_GEMMA_ENDPOINT', 'CLOUDFLARE_GEMMA_BEARER_TOKEN'],
            handleTextWithCloudflareGemmaTextModel
          );

          // Add more bot functions as needed...

          async function processBots() {
            const botPromises = botFunctions.map(async (bot) => {
              try {
                const botResponse = await bot.generate(context);
                const botPersona = bot.persona;

                if (botResponse && typeof botResponse === 'string') {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${botResponse}`);

                  if (botResponse.trim().length > 0) {
                    controller.enqueue(
                      `data: ${JSON.stringify({ persona: botPersona, message: botResponse })}\n\n`
                    );
                    context.push({ role: 'bot', content: botResponse, persona: botPersona });
                    return true;
                  }
                }
                return false;
              } catch (error) {
                logger.error(`app/api/chat/route.ts - Error in bot ${bot.persona} processing: ${error}`);
                return false;
              }
            });

            const responses = await Promise.all(botPromises);
            const hasResponse = responses.includes(true);

            context = context.slice(-maxContextMessages);
            clientContexts.set(clientId, context);

            if (!hasResponse) {
              logger.silly(`app/api/chat/route.ts - No bot responded. Ending interaction.`);
            }

            try {
              controller.enqueue('data: [DONE]\n\n');
              controller.close();
            } catch (enqueueError) {
              logger.error(`app/api/chat/route.ts - Error finalizing stream: ${enqueueError}`);
            }
          }

          processBots().catch((error) => {
            logger.error(`app/api/chat/route.ts - Error in streaming bot interaction: ${error}`);
            controller.error(error);
          });
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
      logger.error(`app/api/chat/route.ts - Error in streaming bot interaction: ${error}`);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      );
    } finally {
      clearAbortController(clientId); // Clear the abort controller after processing
    }
  });
}
