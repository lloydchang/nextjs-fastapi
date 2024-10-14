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

const config = getConfig();

const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 20; // Keep only the last 20 messages

// Map to store context per clientId
const clientContexts = new Map<string, any[]>();

// Map to store per-client request queues
const clientRequestQueues = new Map<string, (() => Promise<void>)[]>();

// Map to track if a client's queue is being processed
const clientProcessingFlags = new Map<string, boolean>();

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
  const requestId = uuidv4(); // Use UUID for unique request ID
  const clientId = request.headers.get('x-client-id') || 'unknown-client';

  // Wrap the request processing in a function
  const processRequest = async () => {
    try {
      const { messages } = await request.json();
      if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request format or no messages provided.' },
          { status: 400 }
        );
      }

      // Get or initialize the context for this client
      let context = clientContexts.get(clientId) || [];
      context = [...context, ...messages]; // Append new messages to the context

      // Keep context within limits
      context = context.slice(-maxContextMessages);
      clientContexts.set(clientId, context); // Update the context map

      const stream = new ReadableStream({
        async start(controller) {
          logger.silly(
            `app/api/chat/route.ts [${requestId}] - Started streaming responses to the client for clientId: ${clientId}.`
          );

          // Define the BotFunction interface
          interface BotFunction {
            persona: string;
            generate: (currentContext: any[]) => Promise<string>;
          }

          // Initialize an empty array for valid bot functions
          const botFunctions: BotFunction[] = [];

          // Only add bots with valid configurations and environment variables

          // Ollama Gemma
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

          // Cloudflare Gemma
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

          // Add other bot functions similarly...

          async function processBots() {
            logger.silly(
              `app/api/chat/route.ts [${requestId}] - Starting bot processing for clientId: ${clientId}.`
            );

            // Fetch all bot responses in parallel
            const responses = await Promise.all(
              botFunctions.map((bot) => {
                logger.silly(
                  `app/api/chat/route.ts [${requestId}] - Processing bot ${bot.persona}`
                );
                return bot.generate(context);
              })
            );

            let hasResponse = false;

            // Process the bot responses
            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              if (response && typeof response === 'string') {
                const botPersona = botFunctions[index].persona;

                logger.debug(
                  `app/api/chat/route.ts [${requestId}] - Response from ${botPersona}: ${response}`
                );

                // Send the bot response to the client immediately
                controller.enqueue(
                  `data: ${JSON.stringify({
                    persona: botPersona,
                    message: response,
                  })}\n\n`
                );

                // Add bot response to context
                context.push({
                  role: 'bot',
                  content: response,
                  persona: botPersona,
                });

                hasResponse = true;
              }
            }

            // Keep context within limits
            context = context.slice(-maxContextMessages);
            clientContexts.set(clientId, context); // Update the context map

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
    } finally {
      // After processing, check if there are more requests in the queue
      processNextInQueue(clientId);
    }
  };

  // Function to process the next request in the queue
  function processNextInQueue(clientId: string) {
    const queue = clientRequestQueues.get(clientId);
    if (queue && queue.length > 0) {
      const nextRequest = queue.shift();
      if (nextRequest) {
        nextRequest();
      }
    } else {
      clientProcessingFlags.set(clientId, false);
    }
  }

  // Function to add the request to the client's queue
  function enqueueRequest(clientId: string, requestFunction: () => Promise<void>) {
    if (!clientRequestQueues.has(clientId)) {
      clientRequestQueues.set(clientId, []);
    }
    const queue = clientRequestQueues.get(clientId)!;
    queue.push(requestFunction);

    // If not already processing, start processing the queue
    if (!clientProcessingFlags.get(clientId)) {
      clientProcessingFlags.set(clientId, true);
      processNextInQueue(clientId);
    }
  }

  // Return a promise that will be resolved when the request is processed
  return new Promise<NextResponse>((resolve) => {
    enqueueRequest(clientId, async () => {
      const response = await processRequest();
      resolve(response);
    });
  });
}
