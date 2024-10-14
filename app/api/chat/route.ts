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
}

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
    lastInteractionTimes.set(clientId, Date.now());

    try {
      const { messages } = await request.json();
      if (!Array.isArray(messages) || messages.length === 0) {
        logger.warn(`Request [${requestId}] from clientId: ${clientId} has invalid format or no messages.`);
        return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
      }

      // Get or initialize the context for this client
      let context = clientContexts.get(clientId) || [];
      context = [...context, ...messages]; // Append new messages to the context
      context = context.slice(-maxContextMessages); // Keep context within limits
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          logger.silly(`Started streaming responses to the client for clientId: ${clientId}.`);

          const botFunctions = [];

          // Ollama Gemma
          if (
            isValidConfig(config.ollamaGemmaTextModel) &&
            validateEnvVars(['OLLAMA_GEMMA_TEXT_MODEL', 'OLLAMA_GEMMA_ENDPOINT'])
          ) {
            const ollamaGemmaTextModel = config.ollamaGemmaTextModel || "defaultModel";
            const ollamaGemmaEndpoint = config.ollamaGemmaEndpoint;
            
            const summarizeWithOllamaGemma = async (text: string): Promise<string | null> => {
              return handleTextWithOllamaGemmaTextModel({ userPrompt: text, textModel: ollamaGemmaTextModel }, config);
            };
            
            botFunctions.push({
              persona: 'Ollama Gemma ' + ollamaGemmaTextModel,
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, summarizeWithOllamaGemma);
                clientPrompts.set(clientId, prompt);
                return handleTextWithOllamaGemmaTextModel({ userPrompt: prompt, textModel: ollamaGemmaTextModel }, config);
              },
            });
          }

          // Ollama Llama
          if (
            isValidConfig(config.ollamaLlamaTextModel) &&
            validateEnvVars(['OLLAMA_LLAMA_TEXT_MODEL', 'OLLAMA_LLAMA_ENDPOINT'])
          ) {
            const ollamaLlamaTextModel = config.ollamaLlamaTextModel || "defaultModel";
            
            const summarizeWithOllamaLlama = async (text: string): Promise<string | null> => {
              return handleTextWithOllamaLlamaTextModel({ userPrompt: text, textModel: ollamaLlamaTextModel }, config);
            };
            
            botFunctions.push({
              persona: 'Ollama Llama ' + ollamaLlamaTextModel,
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, summarizeWithOllamaLlama);
                clientPrompts.set(clientId, prompt);
                return handleTextWithOllamaLlamaTextModel({ userPrompt: prompt, textModel: ollamaLlamaTextModel }, config);
              },
            });
          }

          // Cloudflare Gemma
          if (
            isValidConfig(config.cloudflareGemmaTextModel) &&
            validateEnvVars(['CLOUDFLARE_GEMMA_TEXT_MODEL', 'CLOUDFLARE_GEMMA_ENDPOINT', 'CLOUDFLARE_GEMMA_BEARER_TOKEN'])
          ) {
            const cloudflareGemmaTextModel = config.cloudflareGemmaTextModel!;
            
            const summarizeWithCloudflareGemma = async (text: string): Promise<string | null> => {
              return handleTextWithCloudflareGemmaTextModel({ userPrompt: text, textModel: cloudflareGemmaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Cloudflare Gemma ' + cloudflareGemmaTextModel,
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, summarizeWithCloudflareGemma);
                clientPrompts.set(clientId, prompt);
                return handleTextWithCloudflareGemmaTextModel({ userPrompt: prompt, textModel: cloudflareGemmaTextModel }, config);
              },
            });
          }

          // Cloudflare Llama
          if (
            isValidConfig(config.cloudflareLlamaTextModel) &&
            validateEnvVars(['CLOUDFLARE_LLAMA_TEXT_MODEL', 'CLOUDFLARE_LLAMA_ENDPOINT', 'CLOUDFLARE_LLAMA_BEARER_TOKEN'])
          ) {
            const cloudflareLlamaTextModel = config.cloudflareLlamaTextModel!;
            
            const summarizeWithCloudflareLlama = async (text: string): Promise<string | null> => {
              return handleTextWithCloudflareLlamaTextModel({ userPrompt: text, textModel: cloudflareLlamaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Cloudflare Llama ' + cloudflareLlamaTextModel,
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, summarizeWithCloudflareLlama);
                clientPrompts.set(clientId, prompt);
                return handleTextWithCloudflareLlamaTextModel({ userPrompt: prompt, textModel: cloudflareLlamaTextModel }, config);
              },
            });
          }

          // Google Vertex Gemma
          if (
            isValidConfig(config.googleVertexGemmaTextModel) &&
            validateEnvVars(['GOOGLE_VERTEX_GEMMA_TEXT_MODEL', 'GOOGLE_VERTEX_GEMMA_ENDPOINT', 'GOOGLE_VERTEX_GEMMA_LOCATION'])
          ) {
            const googleVertexGemmaTextModel = config.googleVertexGemmaTextModel!;
            
            const summarizeWithGoogleVertexGemma = async (text: string): Promise<string | null> => {
              return handleTextWithGoogleVertexGemmaTextModel({ userPrompt: text, textModel: googleVertexGemmaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Google Vertex Gemma ' + googleVertexGemmaTextModel,
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, summarizeWithGoogleVertexGemma);
                clientPrompts.set(clientId, prompt);
                return handleTextWithGoogleVertexGemmaTextModel({ userPrompt: prompt, textModel: googleVertexGemmaTextModel }, config);
              },
            });
          }

          // Google Vertex Llama
          if (
            isValidConfig(config.googleVertexLlamaTextModel) &&
            validateEnvVars(['GOOGLE_VERTEX_LLAMA_TEXT_MODEL', 'GOOGLE_VERTEX_LLAMA_ENDPOINT', 'GOOGLE_VERTEX_LLAMA_LOCATION'])
          ) {
            const googleVertexLlamaTextModel = config.googleVertexLlamaTextModel!;
            
            const summarizeWithGoogleVertexLlama = async (text: string): Promise<string | null> => {
              return handleTextWithGoogleVertexLlamaTextModel({ userPrompt: text, textModel: googleVertexLlamaTextModel }, config);
            };

            botFunctions.push({
              persona: 'Google Vertex Llama ' + googleVertexLlamaTextModel,
              generate: async (currentContext: any[]) => {
                let prompt = clientPrompts.get(clientId) || config.systemPrompt;
                prompt += `\n\nUser: ${extractValidMessages(currentContext)}`;
                prompt = await managePrompt(prompt, MAX_PROMPT_LENGTH, summarizeWithGoogleVertexLlama);
                clientPrompts.set(clientId, prompt);
                return handleTextWithGoogleVertexLlamaTextModel({ userPrompt: prompt, textModel: googleVertexLlamaTextModel }, config);
              },
            });
          }

          async function processBots() {
            logger.silly(`Starting bot processing for clientId: ${clientId}.`);

            const responses = await Promise.all(
              botFunctions.map((bot) => bot.generate(context))
            );

            let hasResponse = false;

            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              if (response && typeof response === 'string') {
                const botPersona = botFunctions[index].persona;

                logger.debug(`Response from ${botPersona}: ${response}`);

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
              logger.silly(`Session timed out for clientId: ${clientId}. Context reset.`);
            }

            if (!hasResponse) {
              logger.silly(`No bot responded. Ending interaction.`);
            }

            controller.enqueue('data: [DONE]\n\n');
            controller.close();
          }

          processBots().catch((error) => {
            logger.error(`Error in streaming bot interaction: ${error}`);
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
      logger.error(`Error in streaming bot interaction: ${error}`);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
