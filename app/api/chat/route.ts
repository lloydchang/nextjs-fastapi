// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, AppConfig } from 'app/api/chat/utils/config';
import { handleRateLimit } from 'app/api/chat/utils/rateLimiter'; // Updated import
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
import { managePrompt } from 'app/api/chat/utils/promptManager';
import { BotFunction } from 'types'; // Ensure this is correctly exported in 'types'

const clientMutexes = new Map<string, Mutex>(); // Initialize the map to track client Mutexes
const clientContexts = new Map<string, any[]>(); // Initialize the map to track client contexts
const lastInteractionTimes = new Map<string, number>(); // Map to track the last interaction time per client

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  // Handle rate limiting and get the new abort controller
  const { limited, retryAfter, controller } = handleRateLimit(clientId);
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

      // Safely check if the previous request was aborted
      if (controller && controller.signal.aborted) {
        logger.info(`app/api/chat/route.ts - Aborted previous request for clientId: ${clientId}`);
        return NextResponse.json({ message: 'Previous request aborted. Processing new request.' });
      }

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

      let context = clientContexts.get(clientId) || [];
      context = [...context, ...validMessages];
      context = context.slice(-maxContextMessages);
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          const botFunctions: BotFunction[] = [];

          const addBotFunction = (
            personaPrefix: string,
            textModelConfigKey: TextModelConfigKey,
            endpointEnvVars: string[],
            handlerFunction: (input: { userPrompt: string; textModel: string }, config: AppConfig) => Promise<string | null>,
            summarizeFunction: SummarizeFunction
          ) => {
            if (isValidConfig(config[textModelConfigKey]) && validateEnvVars(endpointEnvVars)) {
              const textModel = config[textModelConfigKey] || 'defaultModel';

              botFunctions.push({
                persona: `${personaPrefix} ${textModel}`,
                valid: isValidConfig(config[textModelConfigKey]),
                generate: async (currentContext: any[]) => {
                  let prompt = config.systemPrompt || '';
                  if (currentContext.length > 0) {
                    prompt += `${extractValidMessages(currentContext)}`;
                  }

                  let finalPrompt = prompt;

                  for await (const updatedPrompt of managePrompt(
                    prompt,
                    MAX_PROMPT_LENGTH,
                    summarizeFunction,
                    clientId,
                    textModel
                  )) {
                    if (updatedPrompt.trim().length === 0) {
                      logger.warn(`app/api/chat/route.ts - Prompt for clientId: ${clientId} is empty after management.`);
                      continue;
                    }
                    try {
                      controller.enqueue(
                        `data: ${JSON.stringify({ persona: `${personaPrefix} ${textModel}`, message: updatedPrompt })}\n\n`
                      );
                    } catch (enqueueError) {
                      logger.error(`app/api/chat/route.ts - Enqueue error: ${enqueueError}`);
                    }
                    finalPrompt = updatedPrompt;
                  }

                  if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                    context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                  }
                  clientContexts.set(clientId, context);

                  return handlerFunction({ userPrompt: prompt, textModel }, config);
                },
              });
            }
          };

          addBotFunction(
            'Ollama',
            'ollamaGemmaTextModel',
            ['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'],
            handleTextWithOllamaGemmaTextModel,
            summarizeFunction
          );

          // Other bot functions...

          async function processBots() {
            const botPromises = botFunctions.map(async (bot) => {
              try {
                const botResponse = await bot.generate(context);
                const botPersona = bot.persona;

                if (botResponse && typeof botResponse === 'string') {
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

            const lastInteraction = lastInteractionTimes.get(clientId) || 0;
            if (Date.now() - lastInteraction > sessionTimeout) {
              clientContexts.delete(clientId);
              lastInteractionTimes.delete(clientId);
              logger.silly(`app/api/chat/route.ts - Session timed out for clientId: ${clientId}. Context reset.`);
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
    }
  });
}
