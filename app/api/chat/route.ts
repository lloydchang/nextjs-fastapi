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
import { validateEnvVars } from 'app/api/chat/utils/validate'; // Import validateEnvVars

const config = getConfig();

const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 20; // Keep only the last 20 messages

const processingLocks = new Map<string, boolean>(); // Use clientId for locks
const lastInteractionTimes = new Map<string, number>(); // Track last interaction time per client

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
  try {
    const requestId = uuidv4(); // Use UUID for unique request ID
    const clientId = request.headers.get('x-client-id') || 'unknown-client';

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request format or no messages provided.' },
        { status: 400 }
      );
    }

    let context = messages.slice(-7); // Start with the last 7 user messages

    const stream = new ReadableStream({
      async start(controller) {
        logger.silly(
          `app/api/chat/route.ts [${requestId}] - Started streaming responses to the client for clientId: ${clientId}.`
        );

        // Prevent concurrent processing for the same client ID
        if (processingLocks.has(clientId)) {
          logger.silly(
            `app/api/chat/route.ts [${requestId}] - Already processing for clientId: ${clientId}, skipping.`
          );
          controller.close();
          return;
        }

        processingLocks.set(clientId, true); // Lock this client ID
        logger.silly(`app/api/chat/route.ts [${requestId}] - Lock acquired for clientId: ${clientId}.`);

        // Get last interaction time for this client
        let lastInteractionTime = lastInteractionTimes.get(clientId) || Date.now();

        // Initialize an empty array for valid bot functions
        const botFunctions = [];

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

        // Google Vertex Gemma
        if (
          isValidConfig(config.googleVertexGemmaTextModel) &&
          validateEnvVars([
            'GOOGLE_VERTEX_GEMMA_TEXT_MODEL',
            'GOOGLE_VERTEX_GEMMA_ENDPOINT',
            'GOOGLE_VERTEX_GEMMA_LOCATION',
          ])
        ) {
          botFunctions.push({
            persona: 'Google Vertex ' + config.googleVertexGemmaTextModel!,
            generate: (currentContext: any[]) =>
              handleTextWithGoogleVertexGemmaTextModel(
                {
                  userPrompt: extractValidMessages(currentContext),
                  textModel: config.googleVertexGemmaTextModel!,
                },
                config
              ),
          });
        }

        // Ollama Llama
        if (
          isValidConfig(config.ollamaLlamaTextModel) &&
          validateEnvVars(['OLLAMA_LLAMA_TEXT_MODEL', 'OLLAMA_LLAMA_ENDPOINT'])
        ) {
          botFunctions.push({
            persona: 'Ollama ' + config.ollamaLlamaTextModel!,
            generate: (currentContext: any[]) =>
              handleTextWithOllamaLlamaTextModel(
                {
                  userPrompt: extractValidMessages(currentContext),
                  textModel: config.ollamaLlamaTextModel!,
                },
                config
              ),
          });
        }

        // Cloudflare Llama
        if (
          isValidConfig(config.cloudflareLlamaTextModel) &&
          validateEnvVars([
            'CLOUDFLARE_LLAMA_TEXT_MODEL',
            'CLOUDFLARE_LLAMA_ENDPOINT',
            'CLOUDFLARE_LLAMA_BEARER_TOKEN',
          ])
        ) {
          botFunctions.push({
            persona: 'Cloudflare ' + config.cloudflareLlamaTextModel!,
            generate: (currentContext: any[]) =>
              handleTextWithCloudflareLlamaTextModel(
                {
                  userPrompt: extractValidMessages(currentContext),
                  textModel: config.cloudflareLlamaTextModel!,
                },
                config
              ),
          });
        }

        // Google Vertex Llama
        if (
          isValidConfig(config.googleVertexLlamaTextModel) &&
          validateEnvVars([
            'GOOGLE_VERTEX_LLAMA_TEXT_MODEL',
            'GOOGLE_VERTEX_LLAMA_ENDPOINT',
            'GOOGLE_VERTEX_LLAMA_LOCATION',
          ])
        ) {
          botFunctions.push({
            persona: 'Google Vertex ' + config.googleVertexLlamaTextModel!,
            generate: (currentContext: any[]) =>
              handleTextWithGoogleVertexLlamaTextModel(
                {
                  userPrompt: extractValidMessages(currentContext),
                  textModel: config.googleVertexLlamaTextModel!,
                },
                config
              ),
          });
        }

        async function processBots() {
          logger.silly(
            `app/api/chat/route.ts [${requestId}] - Starting parallel bot processing for clientId: ${clientId}.`
          );

          // Fetch all bot responses in parallel
          const responses = await Promise.all(
            botFunctions.map((bot) => {
              logger.silly(
                `app/api/chat/route.ts [${requestId}] - Starting parallel bot processing for ${bot.persona}`
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

              context.push({
                role: 'bot',
                content: response,
                persona: botPersona,
              });

              // Send the bot response to the client immediately
              controller.enqueue(
                `data: ${JSON.stringify({
                  persona: botPersona,
                  message: response,
                })}\n\n`
              );

              hasResponse = true;
            }
          }

          // Keep context within limits
          context = context.slice(-maxContextMessages);

          // Update last interaction time
          lastInteractionTime = Date.now();
          lastInteractionTimes.set(clientId, lastInteractionTime);

          if (Date.now() - lastInteractionTime > sessionTimeout) {
            context = [];
            lastInteractionTimes.set(clientId, Date.now());
            logger.silly(
              `app/api/chat/route.ts [${requestId}] - Session timed out for clientId: ${clientId}. Context reset.`
            );
          }

          if (!hasResponse) {
            logger.silly(
              `app/api/chat/route.ts [${requestId}] - No bot responded. Ending interaction.`
            );
          }

          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          processingLocks.delete(clientId); // Release the lock after processing
          logger.silly(`app/api/chat/route.ts [${requestId}] - Lock released for clientId: ${clientId}.`);
        }

        processBots().catch((error) => {
          logger.error(
            `app/api/chat/route.ts [${requestId}] - Error in streaming bot interaction: ${error}`
          );
          controller.error(error);
          processingLocks.delete(clientId); // Ensure the lock is released on error
          logger.silly(
            `app/api/chat/route.ts [${requestId}] - Lock released after error for clientId: ${clientId}.`
          );
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
      `app/api/chat/route.ts - Error in streaming bot interaction: ${error}`
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
