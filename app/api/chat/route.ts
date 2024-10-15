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

          // Ollama Gemma
          if (isValidConfig(config.ollamaGemmaTextModel) && validateEnvVars(['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'])) {
            const ollamaGemmaTextModel = config.ollamaGemmaTextModel || "defaultModel";

            const summarizeWithOllamaGemma = async (text: string): Promise<string | null> => {
              logger.debug(`app/api/chat/route.ts - Using Ollama Gemma model (${ollamaGemmaTextModel}) for clientId: ${clientId}`);
              return handleTextWithOllamaGemmaTextModel({ userPrompt: text, textModel: ollamaGemmaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Ollama ' + ollamaGemmaTextModel,
              valid: isValidConfig(config.ollamaGemmaTextModel),
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                
                let finalPrompt = prompt;
                // Use AsyncGenerator to send intermediate prompt results
                for await (const updatedPrompt of managePrompt(prompt || '', MAX_PROMPT_LENGTH, summarizeWithOllamaGemma, clientId, ollamaGemmaTextModel)) {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                  controller.enqueue(`data: ${JSON.stringify({ persona: 'Ollama ' + ollamaGemmaTextModel, message: updatedPrompt })}\n\n`);
                  finalPrompt = updatedPrompt;
                }

                // Update the last message in the context with the summarized version, if it's new
                if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                  context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                }
                clientContexts.set(clientId, context);

                clientPrompts.set(clientId, prompt ?? config.systemPrompt ?? '');
                return handleTextWithOllamaGemmaTextModel({ userPrompt: prompt ?? '', textModel: ollamaGemmaTextModel }, config);
              },
            });
          }

          // Ollama Llama
          if (isValidConfig(config.ollamaLlamaTextModel) && validateEnvVars(['OLLAMA_LLAMA_TEXT_MODEL', 'OLLAMA_LLAMA_ENDPOINT'])) {
            const ollamaLlamaTextModel = config.ollamaLlamaTextModel || "defaultModel";

            const summarizeWithOllamaLlama = async (text: string): Promise<string | null> => {
              logger.debug(`app/api/chat/route.ts - Using Ollama Llama model (${ollamaLlamaTextModel}) for clientId: ${clientId}`);
              return handleTextWithOllamaLlamaTextModel({ userPrompt: text, textModel: ollamaLlamaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Ollama ' + ollamaLlamaTextModel,
              valid: isValidConfig(config.ollamaLlamaTextModel),
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;

                let finalPrompt = prompt;
                // Use AsyncGenerator to send intermediate prompt results
                for await (const updatedPrompt of managePrompt(prompt || '', MAX_PROMPT_LENGTH, summarizeWithOllamaLlama, clientId, ollamaLlamaTextModel)) {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                  controller.enqueue(`data: ${JSON.stringify({ persona: 'Ollama ' + ollamaLlamaTextModel, message: updatedPrompt })}\n\n`);
                  finalPrompt = updatedPrompt;
                }

                // Update the last message in the context with the summarized version, if it's new
                if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                  context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                }
                clientContexts.set(clientId, context);

                clientPrompts.set(clientId, prompt ?? config.systemPrompt ?? '');
                return handleTextWithOllamaLlamaTextModel({ userPrompt: prompt ?? '', textModel: ollamaLlamaTextModel }, config);
              },
            });
          }

          // Cloudflare Gemma
          if (isValidConfig(config.cloudflareGemmaTextModel) && validateEnvVars(['CLOUDFLARE_GEMMA_TEXT_MODEL', 'CLOUDFLARE_GEMMA_ENDPOINT', 'CLOUDFLARE_GEMMA_BEARER_TOKEN'])) {
            const cloudflareGemmaTextModel = config.cloudflareGemmaTextModel!;

            const summarizeWithCloudflareGemma = async (text: string): Promise<string | null> => {
              logger.debug(`app/api/chat/route.ts - Using Cloudflare Gemma model (${cloudflareGemmaTextModel}) for clientId: ${clientId}`);
              return handleTextWithCloudflareGemmaTextModel({ userPrompt: text, textModel: cloudflareGemmaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Cloudflare ' + cloudflareGemmaTextModel,
              valid: isValidConfig(config.cloudflareGemmaTextModel),
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;

                let finalPrompt = prompt;
                // Use AsyncGenerator to send intermediate prompt results
                for await (const updatedPrompt of managePrompt(prompt || '', MAX_PROMPT_LENGTH, summarizeWithCloudflareGemma, clientId, cloudflareGemmaTextModel)) {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                  controller.enqueue(`data: ${JSON.stringify({ persona: 'Cloudflare ' + cloudflareGemmaTextModel, message: updatedPrompt })}\n\n`);
                  finalPrompt = updatedPrompt;
                }

                // Update the last message in the context with the summarized version, if it's new
                if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                  context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                }
                clientContexts.set(clientId, context);

                clientPrompts.set(clientId, prompt ?? config.systemPrompt ?? '');
                return handleTextWithCloudflareGemmaTextModel({ userPrompt: prompt ?? '', textModel: cloudflareGemmaTextModel }, config);
              },
            });
          }

          // Cloudflare Llama
          if (isValidConfig(config.cloudflareLlamaTextModel) && validateEnvVars(['CLOUDFLARE_LLAMA_TEXT_MODEL', 'CLOUDFLARE_LLAMA_ENDPOINT', 'CLOUDFLARE_LLAMA_BEARER_TOKEN'])) {
            const cloudflareLlamaTextModel = config.cloudflareLlamaTextModel!;

            const summarizeWithCloudflareLlama = async (text: string): Promise<string | null> => {
              logger.debug(`app/api/chat/route.ts - Using Cloudflare Llama model (${cloudflareLlamaTextModel}) for clientId: ${clientId}`);
              return handleTextWithCloudflareLlamaTextModel({ userPrompt: text, textModel: cloudflareLlamaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Cloudflare ' + cloudflareLlamaTextModel,
              valid: isValidConfig(config.cloudflareLlamaTextModel),
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;

                let finalPrompt = prompt;
                // Use AsyncGenerator to send intermediate prompt results
                for await (const updatedPrompt of managePrompt(prompt || '', MAX_PROMPT_LENGTH, summarizeWithCloudflareLlama, clientId, cloudflareLlamaTextModel)) {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                  controller.enqueue(`data: ${JSON.stringify({ persona: 'Cloudflare ' + cloudflareLlamaTextModel, message: updatedPrompt })}\n\n`);
                  finalPrompt = updatedPrompt;
                }

                // Update the last message in the context with the summarized version, if it's new
                if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                  context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                }
                clientContexts.set(clientId, context);

                clientPrompts.set(clientId, prompt ?? config.systemPrompt ?? '');
                return handleTextWithCloudflareLlamaTextModel({ userPrompt: prompt ?? '', textModel: cloudflareLlamaTextModel }, config);
              },
            });
          }

          // Google Vertex Gemma
          if (isValidConfig(config.googleVertexGemmaTextModel) && validateEnvVars(['GOOGLE_VERTEX_GEMMA_TEXT_MODEL', 'GOOGLE_VERTEX_GEMMA_ENDPOINT', 'GOOGLE_VERTEX_GEMMA_LOCATION'])) {
            const googleVertexGemmaTextModel = config.googleVertexGemmaTextModel!;

            const summarizeWithGoogleVertexGemma = async (text: string): Promise<string | null> => {
              logger.debug(`app/api/chat/route.ts - Using Google Vertex Gemma model (${googleVertexGemmaTextModel}) for clientId: ${clientId}`);
              return handleTextWithGoogleVertexGemmaTextModel({ userPrompt: text, textModel: googleVertexGemmaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Google Vertex ' + googleVertexGemmaTextModel,
              valid: isValidConfig(config.googleVertexGemmaTextModel),
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;

                let finalPrompt = prompt;
                // Use AsyncGenerator to send intermediate prompt results
                for await (const updatedPrompt of managePrompt(prompt || '', MAX_PROMPT_LENGTH, summarizeWithGoogleVertexGemma, clientId, googleVertexGemmaTextModel)) {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                  controller.enqueue(`data: ${JSON.stringify({ persona: 'Google Vertex ' + googleVertexGemmaTextModel, message: updatedPrompt })}\n\n`);
                  finalPrompt = updatedPrompt;
                }

                // Update the last message in the context with the summarized version, if it's new
                if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                  context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                }
                clientContexts.set(clientId, context);

                clientPrompts.set(clientId, prompt ?? config.systemPrompt ?? '');
                return handleTextWithGoogleVertexGemmaTextModel({ userPrompt: prompt ?? '', textModel: googleVertexGemmaTextModel }, config);
              },
            });
          }

          // Google Vertex Llama
          if (isValidConfig(config.googleVertexLlamaTextModel) && validateEnvVars(['GOOGLE_VERTEX_LLAMA_TEXT_MODEL', 'GOOGLE_VERTEX_LLAMA_ENDPOINT', 'GOOGLE_VERTEX_LLAMA_LOCATION'])) {
            const googleVertexLlamaTextModel = config.googleVertexLlamaTextModel!;

            const summarizeWithGoogleVertexLlama = async (text: string): Promise<string | null> => {
              logger.debug(`app/api/chat/route.ts - Using Google Vertex Llama model (${googleVertexLlamaTextModel}) for clientId: ${clientId}`);
              return handleTextWithGoogleVertexLlamaTextModel({ userPrompt: text, textModel: googleVertexLlamaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Google Vertex ' + googleVertexLlamaTextModel,
              valid: isValidConfig(config.googleVertexLlamaTextModel),
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;

                let finalPrompt = prompt;
                // Use AsyncGenerator to send intermediate prompt results
                for await (const updatedPrompt of managePrompt(prompt || '', MAX_PROMPT_LENGTH, summarizeWithGoogleVertexLlama, clientId, googleVertexLlamaTextModel)) {
                  logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                  controller.enqueue(`data: ${JSON.stringify({ persona: 'Google Vertex ' + googleVertexLlamaTextModel, message: updatedPrompt })}\n\n`);
                  finalPrompt = updatedPrompt;
                }

                // Update the last message in the context with the summarized version, if it's new
                if (context.length > 0 && context[context.length - 1].content !== finalPrompt) {
                  context[context.length - 1] = { ...context[context.length - 1], content: finalPrompt };
                }
                clientContexts.set(clientId, context);

                clientPrompts.set(clientId, prompt ?? config.systemPrompt ?? '');
                return handleTextWithGoogleVertexLlamaTextModel({ userPrompt: prompt ?? '', textModel: googleVertexLlamaTextModel }, config);
              },
            });
          }

          async function processBots() {
            logger.silly(`app/api/chat/route.ts - Starting bot processing for clientId: ${clientId}.`);

            const responses = await Promise.all(botFunctions.map((bot) => bot.generate(context)));

            let hasResponse = false;

            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              const botPersona = botFunctions[index].persona; // Define botPersona here
              const response = responses[index];
              if (response && typeof response === 'string') {

                logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);

                controller.enqueue(
                  `data: ${JSON.stringify({ persona: botPersona, message: response })}\n\n`
                );

                context.push({ role: 'bot', content: response, persona: botPersona });
                hasResponse = true;
              }
            }

            context = context.slice(-maxContextMessages); // Keep context within limits
            clientContexts.set(clientId, context);

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
