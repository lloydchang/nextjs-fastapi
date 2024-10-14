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

const config = getConfig();

const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout
const maxContextMessages = 20; // Keep only the last 20 messages

let lastInteractionTime = Date.now(); // Track last interaction time
const processingLocks = new Map<string, boolean>(); // Moved to module scope

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
          `app/api/chat/route.ts [${requestId}] - Started streaming responses to the client.`
        );

        // Prevent concurrent processing for the same request ID
        if (processingLocks.has(requestId)) {
          logger.silly(
            `app/api/chat/route.ts [${requestId}] - Already processing, skipping.`
          );
          controller.close();
          return;
        }

        processingLocks.set(requestId, true); // Lock this request ID
        logger.silly(`app/api/chat/route.ts [${requestId}] - Lock acquired.`);

        // Initialize an empty array for valid bot functions
        const botFunctions = [];

        // Only add bots with valid configurations
        if (isValidConfig(config.ollamaGemmaTextModel)) {
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

        if (isValidConfig(config.cloudflareGemmaTextModel)) {
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

        if (isValidConfig(config.googleVertexGemmaTextModel)) {
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

        if (isValidConfig(config.ollamaLlamaTextModel)) {
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

        if (isValidConfig(config.cloudflareLlamaTextModel)) {
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

        if (isValidConfig(config.googleVertexLlamaTextModel)) {
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
            `app/api/chat/route.ts [${requestId}] - Starting parallel bot processing`
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

          if (Date.now() - lastInteractionTime > sessionTimeout) {
            context = [];
            lastInteractionTime = Date.now();
            logger.silly(
              `app/api/chat/route.ts [${requestId}] - Session timed out. Context reset.`
            );
          }

          if (!hasResponse) {
            logger.silly(
              `app/api/chat/route.ts [${requestId}] - No bot responded. Ending interaction.`
            );
          }

          controller.enqueue('data: [DONE]\n\n');
          controller.close();
          processingLocks.delete(requestId); // Release the lock after processing
          logger.silly(`app/api/chat/route.ts [${requestId}] - Lock released.`);
        }

        processBots().catch((error) => {
          logger.error(
            `app/api/chat/route.ts [${requestId}] - Error in streaming bot interaction: ${error}`
          );
          controller.error(error);
          processingLocks.delete(requestId); // Ensure the lock is released on error
          logger.silly(
            `app/api/chat/route.ts [${requestId}] - Lock released after error.`
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
