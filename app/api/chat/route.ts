// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from 'app/api/chat/utils/config';
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

const config = getConfig();

const MAX_PROMPT_LENGTH = 2000; // Adjust based on Ollama Gemma's default token limit of 2000
const RATE_LIMIT = 1; // Max number of requests per client during the rate limit window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 20; // Keep only the last 20 messages

// Maps to track client-specific data
const clientPrompts = new Map<string, string>();
const clientMutexes = new Map<string, Mutex>();
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
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

// Function to handle summarization and generation for each model
async function handleModel({
  modelKey,
  textModel,
  summarizeFn,
  handleTextFn,
  clientId,
  currentContext,
  controller,
}: {
  modelKey: string;
  textModel: string;
  summarizeFn: (text: string) => Promise<string | null>;
  handleTextFn: (input: { userPrompt: string, textModel: string }, config: any) => Promise<string | null>;
  clientId: string;
  currentContext: any[];
  controller: ReadableStreamDefaultController<any>;
}) {
  const prompt = clientPrompts.get(clientId) || config.systemPrompt;
  let finalPrompt = `${prompt}\n\nUser: ${extractValidMessages(currentContext)}`;

  // Get the appropriate max prompt length for the model
  const maxLengthMap = {
    ollamaGemma: config.maxPromptLengthOllamaGemma,
    ollamaLlama: config.maxPromptLengthOllamaLlama,
    cloudflareGemma: config.maxPromptLengthCloudflareGemma,
    cloudflareLlama: config.maxPromptLengthCloudflareLlama,
    googleVertexGemma: config.maxPromptLengthGoogleVertexGemma,
    googleVertexLlama: config.maxPromptLengthGoogleVertexLlama,
  };

  // Maps to track client-specific data
  const clientPrompts = new Map<string, string>();
  const clientMutexes = new Map<string, Mutex>();
  const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
  const lastInteractionTimes = new Map<string, number>();
  const clientContexts = new Map<string, any[]>();

  const maxLength = maxLengthMap[modelKey];
  for await (const updatedPrompt of managePrompt(finalPrompt, maxLength, summarizeFn, clientId, textModel)) {
    controller.enqueue(`data: ${JSON.stringify({ persona: `${modelKey} - ${textModel}`, message: updatedPrompt })}\n\n`);
    finalPrompt = updatedPrompt;
  }

  clientPrompts.set(clientId, finalPrompt); // Store final prompt
  clientContexts.set(clientId, [...currentContext, { role: 'bot', content: finalPrompt, persona: modelKey }]); // Update context

  return handleTextFn({ userPrompt: finalPrompt, textModel }, config);
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  logger.info(`app/api/chat/route.ts - Received POST request [${requestId}] from clientId: ${clientId}`);

  const now = Date.now();
  const rateInfo = rateLimitMap.get(clientId);

  // Handle rate limiting
  if (rateInfo) {
    if (now - rateInfo.firstRequestTime < RATE_LIMIT_WINDOW) {
      if (rateInfo.count >= RATE_LIMIT) {
        logger.warn(`app/api/chat/route.ts - ClientId: ${clientId} has exceeded the rate limit.`);
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

          const botFunctions = [];

          // Ollama Gemma
          if (isValidConfig(config.ollamaGemmaTextModel)) {
            const summarizeWithOllamaGemma = async (text: string): Promise<string | null> => {
              return handleTextWithOllamaGemmaTextModel({ userPrompt: text, textModel: config.ollamaGemmaTextModel }, config);
            };
            botFunctions.push({
              persona: 'Ollama Gemma',
              generate: async (currentContext: any[]) =>
                handleModel({
                  modelKey: 'ollamaGemma',
                  textModel: config.ollamaGemmaTextModel!,
                  summarizeFn: summarizeWithOllamaGemma,
                  handleTextFn: handleTextWithOllamaGemmaTextModel,
                  clientId,
                  currentContext,
                  controller,
                }),
            });
          }

          // Ollama Llama
          if (isValidConfig(config.ollamaLlamaTextModel)) {
            const summarizeWithOllamaLlama = async (text: string): Promise<string | null> => {
              return handleTextWithOllamaLlamaTextModel({ userPrompt: text, textModel: config.ollamaLlamaTextModel }, config);
            };
            botFunctions.push({
              persona: 'Ollama Llama',
              generate: async (currentContext: any[]) =>
                handleModel({
                  modelKey: 'ollamaLlama',
                  textModel: config.ollamaLlamaTextModel!,
                  summarizeFn: summarizeWithOllamaLlama,
                  handleTextFn: handleTextWithOllamaLlamaTextModel,
                  clientId,
                  currentContext,
                  controller,
                }),
            });
          }

          // Cloudflare Gemma
          if (isValidConfig(config.cloudflareGemmaTextModel)) {
            const summarizeWithCloudflareGemma = async (text: string): Promise<string | null> => {
              return handleTextWithCloudflareGemmaTextModel({ userPrompt: text, textModel: config.cloudflareGemmaTextModel }, config);
            };
            botFunctions.push({
              persona: 'Cloudflare Gemma',
              generate: async (currentContext: any[]) =>
                handleModel({
                  modelKey: 'cloudflareGemma',
                  textModel: config.cloudflareGemmaTextModel!,
                  summarizeFn: summarizeWithCloudflareGemma,
                  handleTextFn: handleTextWithCloudflareGemmaTextModel,
                  clientId,
                  currentContext,
                  controller,
                }),
            });
          }

          // Cloudflare Llama
          if (isValidConfig(config.cloudflareLlamaTextModel)) {
            const summarizeWithCloudflareLlama = async (text: string): Promise<string | null> => {
              return handleTextWithCloudflareLlamaTextModel({ userPrompt: text, textModel: config.cloudflareLlamaTextModel }, config);
            };
            botFunctions.push({
              persona: 'Cloudflare Llama',
              generate: async (currentContext: any[]) =>
                handleModel({
                  modelKey: 'cloudflareLlama',
                  textModel: config.cloudflareLlamaTextModel!,
                  summarizeFn: summarizeWithCloudflareLlama,
                  handleTextFn: handleTextWithCloudflareLlamaTextModel,
                  clientId,
                  currentContext,
                  controller,
                }),
            });
          }

          // Google Vertex Gemma
          if (isValidConfig(config.googleVertexGemmaTextModel)) {
            const summarizeWithGoogleVertexGemma = async (text: string): Promise<string | null> => {
              return handleTextWithGoogleVertexGemmaTextModel({ userPrompt: text, textModel: config.googleVertexGemmaTextModel }, config);
            };
            botFunctions.push({
              persona: 'Google Vertex Gemma',
              generate: async (currentContext: any[]) =>
                handleModel({
                  modelKey: 'googleVertexGemma',
                  textModel: config.googleVertexGemmaTextModel!,
                  summarizeFn: summarizeWithGoogleVertexGemma,
                  handleTextFn: handleTextWithGoogleVertexGemmaTextModel,
                  clientId,
                  currentContext,
                  controller,
                }),
            });
          }

          // Google Vertex Llama
          if (isValidConfig(config.googleVertexLlamaTextModel)) {
            const summarizeWithGoogleVertexLlama = async (text: string): Promise<string | null> => {
              return handleTextWithGoogleVertexLlamaTextModel({ userPrompt: text, textModel: config.googleVertexLlamaTextModel }, config);
            };
            botFunctions.push({
              persona: 'Google Vertex Llama',
              generate: async (currentContext: any[]) =>
                handleModel({
                  modelKey: 'googleVertexLlama',
                  textModel: config.googleVertexLlamaTextModel!,
                  summarizeFn: summarizeWithGoogleVertexLlama,
                  handleTextFn: handleTextWithGoogleVertexLlamaTextModel,
                  clientId,
                  currentContext,
                  controller,
                }),
            });
          }

          async function processBots() {
            logger.silly(`app/api/chat/route.ts - Starting bot processing for clientId: ${clientId}.`);
            const responses = await Promise.all(botFunctions.map((bot) => bot.generate(context)));
            responses.forEach((response, index) => {
              if (response) {
                const botPersona = botFunctions[index].persona;
                logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);
                context.push({ role: 'bot', content: response, persona: botPersona });
              }
            });

            context = context.slice(-maxContextMessages);
            clientContexts.set(clientId, context);

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
