// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from 'app/api/chat/utils/config';
import { checkRateLimit } from 'app/api/chat/utils/rateLimiter'; // Import rate limiter
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
import { BotFunction } from 'types';

const config = getConfig();

const MAX_PROMPT_LENGTH = 2000; // Adjust based on Ollama Gemma's default token limit of 2000
const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 20; // Keep only the last 20 messages

// Maps to track client-specific data
const clientPrompts = new Map<string, string>();
const clientMutexes = new Map<string, Mutex>();
const lastInteractionTimes = new Map<string, number>();
const clientContexts = new Map<string, any[]>();

// Helper function to check if a configuration value is valid
function isValidConfig(value: any): boolean {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    value.trim().toLowerCase() !== 'undefined' &&
    value.trim().toLowerCase() !== 'null'
  );
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  logger.info(`app/api/chat/route.ts - Received POST request [${requestId}] from clientId: ${clientId}`);

  // Handle rate limiting
  const { limited, retryAfter } = checkRateLimit(clientId);
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
      if (!Array.isArray(messages) || messages.length === 0) {
        logger.warn(`app/api/chat/route.ts - Request [${requestId}] from clientId: ${clientId} has invalid format or no messages.`);
        return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
      }

      // Get or initialize the context for this client
      let context = clientContexts.get(clientId) || [];
      context = [...context, ...messages]; // Append new messages to the context
      context = context.slice(-maxContextMessages); // Keep context within limits
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          logger.silly(`app/api/chat/route.ts - Started streaming responses to the client for clientId: ${clientId}.`);

          const botFunctions: BotFunction[] = []; // Initialize botFunctions here

          // Function to add botFunction to the array
          const addBotFunction = (
            personaPrefix: string,
            textModelConfigKey: string,
            endpointEnvVars: string[],
            handlerFunction: Function,
            summarizeFunction: Function
          ) => {
            if (isValidConfig(config[textModelConfigKey]) && validateEnvVars(endpointEnvVars)) {
              const textModel = config[textModelConfigKey] || "defaultModel";

              botFunctions.push({
                persona: `${personaPrefix} ${textModel}`,
                valid: isValidConfig(config[textModelConfigKey]),
                generate: async (currentContext: any[]) => {
                  // Create separate prompt and context for each bot
                  let prompt = config.systemPrompt || '';
                  if (currentContext.length > 0) {
                    prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                  }

                  let finalPrompt = prompt;
                  // Use AsyncGenerator to send intermediate prompt results
                  for await (const updatedPrompt of managePrompt(
                    prompt,
                    MAX_PROMPT_LENGTH,
                    summarizeFunction,
                    clientId,
                    textModel
                  )) {
                    logger.debug(
                      `app/api/chat/route.ts - Using ${personaPrefix} model (${textModel}) for clientId: ${clientId} - Updated prompt: ${updatedPrompt}`
                    );
                    controller.enqueue(
                      `data: ${JSON.stringify({ persona: `${personaPrefix} ${textModel}`, message: updatedPrompt })}\n\n`
                    );
                    finalPrompt = updatedPrompt;
                  }

                  // Update the last message in the context with the summarized version, if it's new
                  if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                    context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                  }
                  clientContexts.set(clientId, context);

                  // No need to set clientPrompts globally; keep it per bot
                  return handlerFunction({ userPrompt: prompt, textModel }, config);
                },
              });
            }
          };

          // Add all bot functions using the helper
          addBotFunction(
            'Ollama',
            'ollamaGemmaTextModel',
            ['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'],
            handleTextWithOllamaGemmaTextModel,
            async (text: string) => {
              return handleTextWithOllamaGemmaTextModel({ userPrompt: text, textModel: config.ollamaGemmaTextModel }, config);
            }
          );

          addBotFunction(
            'Ollama',
            'ollamaLlamaTextModel',
            ['OLLAMA_LLAMA_TEXT_MODEL', 'OLLAMA_LLAMA_ENDPOINT'],
            handleTextWithOllamaLlamaTextModel,
            async (text: string) => {
              return handleTextWithOllamaLlamaTextModel({ userPrompt: text, textModel: config.ollamaLlamaTextModel }, config);
            }
          );

          addBotFunction(
            'Cloudflare',
            'cloudflareGemmaTextModel',
            ['CLOUDFLARE_GEMMA_TEXT_MODEL', 'CLOUDFLARE_GEMMA_ENDPOINT', 'CLOUDFLARE_GEMMA_BEARER_TOKEN'],
            handleTextWithCloudflareGemmaTextModel,
            async (text: string) => {
              return handleTextWithCloudflareGemmaTextModel({ userPrompt: text, textModel: config.cloudflareGemmaTextModel }, config);
            }
          );

          addBotFunction(
            'Cloudflare',
            'cloudflareLlamaTextModel',
            ['CLOUDFLARE_LLAMA_TEXT_MODEL', 'CLOUDFLARE_LLAMA_ENDPOINT', 'CLOUDFLARE_LLAMA_BEARER_TOKEN'],
            handleTextWithCloudflareLlamaTextModel,
            async (text: string) => {
              return handleTextWithCloudflareLlamaTextModel({ userPrompt: text, textModel: config.cloudflareLlamaTextModel }, config);
            }
          );

          addBotFunction(
            'Google Vertex',
            'googleVertexGemmaTextModel',
            ['GOOGLE_VERTEX_GEMMA_TEXT_MODEL', 'GOOGLE_VERTEX_GEMMA_ENDPOINT', 'GOOGLE_VERTEX_GEMMA_LOCATION'],
            handleTextWithGoogleVertexGemmaTextModel,
            async (text: string) => {
              return handleTextWithGoogleVertexGemmaTextModel({ userPrompt: text, textModel: config.googleVertexGemmaTextModel }, config);
            }
          );

          addBotFunction(
            'Google Vertex',
            'googleVertexLlamaTextModel',
            ['GOOGLE_VERTEX_LLAMA_TEXT_MODEL', 'GOOGLE_VERTEX_LLAMA_ENDPOINT', 'GOOGLE_VERTEX_LLAMA_LOCATION'],
            handleTextWithGoogleVertexLlamaTextModel,
            async (text: string) => {
              return handleTextWithGoogleVertexLlamaTextModel({ userPrompt: text, textModel: config.googleVertexLlamaTextModel }, config);
            }
          );

          async function processBots() {
            logger.silly(`app/api/chat/route.ts - Starting bot processing for clientId: ${clientId}.`);

            let hasResponse = false;

            // Process each bot function sequentially
            for (const bot of botFunctions) {
              try {
                const botResponse = await bot.generate(context);
                const botPersona = bot.persona;

                if (botResponse && typeof botResponse === 'string') {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${botResponse}`);

                  controller.enqueue(
                    `data: ${JSON.stringify({ persona: botPersona, message: botResponse })}\n\n`
                  );

                  // Update context with bot response
                  context.push({ role: 'bot', content: botResponse, persona: botPersona });
                  hasResponse = true;
                }
              } catch (error) {
                logger.error(`app/api/chat/route.ts - Error in bot ${bot.persona} processing: ${error}`);
              }
            }

            // Trim context to maintain limits
            context = context.slice(-maxContextMessages);
            clientContexts.set(clientId, context);

            // Handle session timeout
            if (Date.now() - lastInteractionTimes.get(clientId)! > sessionTimeout) {
              clientContexts.delete(clientId);
              lastInteractionTimes.delete(clientId);
              logger.silly(`app/api/chat/route.ts - Session timed out for clientId: ${clientId}. Context reset.`);
            }

            if (!hasResponse) {
              logger.silly(`app/api/chat/route.ts - No bot responded. Ending interaction.`);
            }

            controller.enqueue('data: [DONE]\n\n');
            controller.close();
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
