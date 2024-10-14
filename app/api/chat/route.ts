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
import pQueue from 'p-queue';

const config = getConfig();

const sessionTimeout = 60 * 60 * 1000;
const maxBotsSharedContextMessages = 1;

const clientContexts = new Map<string, any[]>();
const clientQueues = new Map<string, pQueue>();

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

  let queue = clientQueues.get(clientId);
  if (!queue) {
    queue = new pQueue({ concurrency: 1 });
    clientQueues.set(clientId, queue);
  }

  return queue.add(async () => {
    try {
      const { messages } = await request.json();
      if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request format or no messages provided.' },
          { status: 400 }
        );
      }

      let context = clientContexts.get(clientId) || [];
      context = [...context, ...messages];
      context = context.slice(-maxBotsSharedContextMessages);
      clientContexts.set(clientId, context);

      const stream = new ReadableStream({
        async start(controller) {
          interface BotFunction {
            persona: string;
            generate: (currentContext: any[]) => Promise<string>;
          }

          const botFunctions: BotFunction[] = [];

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

          if (
            isValidConfig(config.cloudflareGemmaTextModel) &&
            validateEnvVars([
              'CLOUDFLARE_GEMMA_TEXT_MODEL',
              'CLOUDFLARE_GEMMA_ENDPOINT',
              'CLOUDFLARE_GEMMA_BEARER_TOKEN',
            ])
          ) {
            botFunctions.push({
              persona: 'Cloudflare ' + config.cloudflareGemmaTextModel!,
              generate: (currentContext: any[]) =>
                handleTextWithCloudflareGemmaTextModel(
                  {
                    userPrompt: extractValidMessages(currentContext),
                    textModel: config.cloudflareGemmaTextModel!,
                  },
                  config
                ),
            });
          }

          // Add other bot functions here...

          async function processBots() {
            const responses = await Promise.all(
              botFunctions.map((bot) => bot.generate(context))
            );

            let hasResponse = false;

            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              if (response && typeof response === 'string') {
                const botPersona = botFunctions[index].persona;

                logger.debug(
                  `app/api/chat/route.ts [${requestId}] - Response from ${botPersona}: ${response}`
                );

                controller.enqueue(
                  `data: ${JSON.stringify({
                    persona: botPersona,
                    message: response,
                  })}\n\n`
                );

                context.push({
                  role: 'bot',
                  content: response,
                  persona: botPersona,
                });

                hasResponse = true;
              }
            }

            context = context.slice(-maxBotsSharedContextMessages);
            clientContexts.set(clientId, context);

            if (!hasResponse) {
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
