// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, AppConfig } from 'app/api/chat/utils/config';
import { checkRateLimit } from 'app/api/chat/utils/rateLimiter'; // Import rate limiter
import { extractValidMessages } from 'app/api/chat/utils/filterContext'; // Import extractValidMessages
import { UserPrompt } from 'types'; // Import UserPrompt type from centralized types
import logger from 'app/api/chat/utils/logger';
import { Mutex } from 'async-mutex';
import { BotFunction } from 'types'; // Ensure this is correctly exported in 'types'
import { addBotFunctions } from 'app/api/chat/controllers/BotHandlers'; // Import the centralized handler
import { isValidConfig } from 'app/api/chat/utils/validation'; // Import the shared utility

/**
 * Union type for text model configuration keys.
 */
type TextModelConfigKey =
  | 'ollamaGemmaTextModel'
  | 'ollamaLlamaTextModel'
  | 'cloudflareGemmaTextModel'
  | 'cloudflareLlamaTextModel'
  | 'googleVertexGemmaTextModel'
  | 'googleVertexLlamaTextModel';

const config: AppConfig = getConfig();

const MAX_PROMPT_LENGTH = 128000; // Adjust based on token size limit
const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 100; // Keep only the last 100 messages (adjust based on needs)

// Maps to track client-specific data
const clientMutexes = new Map<string, Mutex>();
const lastInteractionTimes = new Map<string, number>();
const clientContexts = new Map<string, UserPrompt[]>(); // Changed to UserPrompt[]>

/**
 * Handles POST requests to the chat API.
 * @param request - The incoming NextRequest.
 * @returns A NextResponse containing the streamed bot responses or an error.
 */
export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || `anon-${uuidv4()}`; // Generate unique ID for anonymous clients

  // Log the receipt of a new POST request
  logger.silly(
    `Received POST request [${requestId}] from clientId: ${clientId}`
  );

  // Handle rate limiting
  const { limited, retryAfter } = checkRateLimit(clientId);
  if (limited) {
    logger.warn(
      `ClientId: ${clientId} has exceeded the rate limit. RequestId: ${requestId}`
    );
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

  // Acquire or create a mutex for the client
  let mutex = clientMutexes.get(clientId);
  if (!mutex) {
    mutex = new Mutex();
    clientMutexes.set(clientId, mutex);
    logger.silly(`Created new mutex for clientId: ${clientId}`);
  }

  // Run the critical section exclusively
  return mutex.runExclusive(async () => {
    // Update the last interaction time
    lastInteractionTimes.set(clientId, Date.now());
    logger.silly(
      `Updated last interaction time for clientId: ${clientId} at ${new Date().toISOString()}`
    );

    try {
      const body = await request.json();

      // **New Silly Log Statement: Log the Request Body**
      logger.debug(
        `Request body for RequestId: ${requestId}, clientId: ${clientId}: ${JSON.stringify(body)}`
      );

      const { messages } = body;

      // Ensure messages is an array
      if (!Array.isArray(messages)) {
        logger.warn(
          `Invalid request format: messages must be an array. RequestId: ${requestId}, clientId: ${clientId}`
        );
        return NextResponse.json(
          { error: 'Invalid request format: messages must be an array' },
          { status: 400 }
        );
      }

      logger.silly(
        `Received ${messages.length} messages from clientId: ${clientId}, RequestId: ${requestId}`
      );

      // Filter out invalid messages (e.g., empty content)
      const validMessages: UserPrompt[] = extractValidMessages(messages);

      logger.silly(
        `Filtered to ${validMessages.length} valid messages for clientId: ${clientId}, RequestId: ${requestId}`
      );

      if (validMessages.length === 0) {
        logger.warn(
          `Request [${requestId}] from clientId: ${clientId} has invalid format or no valid messages.`
        );
        return NextResponse.json(
          { error: 'Invalid request format or no valid messages provided.' },
          { status: 400 }
        );
      }

      // Get or initialize the context for this client
      let context = clientContexts.get(clientId) || [];

      // Prepend new valid messages in reverse order to prioritize latest messages
      context = [...validMessages.reverse(), ...context];

      // Trim the context to ensure it doesn't exceed the max message limit
      context = context.slice(-maxContextMessages);
      clientContexts.set(clientId, context);

      logger.silly(
        `Updated context for clientId: ${clientId}. Current context size: ${context.length}`
      );

      // Define a timeout for bot processing to ensure we stay within Vercel's limit
      const BOT_PROCESSING_TIMEOUT = 9500; // 9.5 seconds

      // Create a ReadableStream to handle streaming responses
      const stream = new ReadableStream({
        async start(controller) {
          const botFunctions: BotFunction[] = [];

          // Use the centralized addBotFunctions to populate botFunctions
          addBotFunctions(botFunctions, config);

          /**
           * Processes all bot functions and streams their responses.
           */
          async function processBots() {
            logger.silly(
              `Processing ${botFunctions.length} bot functions for clientId: ${clientId}, RequestId: ${requestId}`
            );

            // Wrap the bot processing in a timeout using Promise.race
            try {
              await Promise.race([
                (async () => {
                  // Process all bots concurrently
                  const botPromises = botFunctions.map(async (bot) => {
                    try {
                      const botResponse = await bot.generate(context);
                      const botPersona = bot.persona;

                      if (botResponse && typeof botResponse === 'string') {
                        logger.debug(
                          `Response from ${botPersona}: ${botResponse}`
                        );

                        // Stream the response
                        controller.enqueue(
                          `data: ${JSON.stringify({
                            persona: botPersona,
                            message: botResponse,
                          })}\n\n`
                        );

                        // Update context with bot response
                        context.push({
                          role: 'bot',
                          content: botResponse,
                          persona: botPersona, // Now allowed as UserPrompt includes 'persona'
                        });
                        logger.silly(
                          `Added bot response to context. New context size: ${context.length}`
                        );
                        return true;
                      }
                      return false;
                    } catch (error) {
                      logger.error(
                        `Error in bot ${bot.persona} processing: ${error}`
                      );
                      return false;
                    }
                  });

                  // Await all bot responses
                  const responses = await Promise.all(botPromises);
                  const hasResponse = responses.includes(true);

                  context = context.slice(-maxContextMessages);
                  clientContexts.set(clientId, context);

                  logger.silly(
                    `Final context size after bot processing for clientId: ${clientId}: ${context.length}`
                  );

                  // Handle session timeout
                  const lastInteraction = lastInteractionTimes.get(clientId) || 0;
                  if (Date.now() - lastInteraction > sessionTimeout) {
                    clientContexts.delete(clientId);
                    lastInteractionTimes.delete(clientId);
                    logger.silly(
                      `Session timed out for clientId: ${clientId}. Context reset.`
                    );
                    context = []; // Reset context after timeout
                  }

                  if (!hasResponse) {
                    logger.silly(
                      `No bot responded for clientId: ${clientId}, RequestId: ${requestId}. Ending interaction.`
                    );
                  }

                  // Signal the end of the stream
                  try {
                    controller.enqueue('data: [DONE]\n\n');
                    controller.close();
                    logger.silly(
                      `Stream closed successfully for clientId: ${clientId}, RequestId: ${requestId}`
                    );
                  } catch (enqueueError) {
                    logger.error(
                      `Error finalizing stream: ${enqueueError} for clientId: ${clientId}, RequestId: ${requestId}`
                    );
                  }
                })(),
                // Timeout promise
                new Promise<void>((_, reject) =>
                  setTimeout(
                    () => reject(new Error('Bot processing timed out')),
                    BOT_PROCESSING_TIMEOUT
                  )
                ),
              ]);
            } catch (timeoutError) {
              logger.error(
                `Bot processing timed out for clientId: ${clientId}, RequestId: ${requestId}`
              );
              controller.enqueue(
                `data: ${JSON.stringify({
                  error: 'Bot processing timed out. Please try again.',
                })}\n\n`
              );
              controller.enqueue('data: [DONE]\n\n');
              controller.close();
            }
          }

          processBots().catch((error) => {
            logger.error(
              `Error in streaming bot interaction: ${error} for clientId: ${clientId}, RequestId: ${requestId}`
            );
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
      logger.error(
        `Error in streaming bot interaction: ${
          error instanceof Error ? error.message : error
        } for clientId: ${clientId}, RequestId: ${requestId}`
      );
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Internal Server Error',
        },
        { status: 500 }
      );
    }
  });
}
