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

// Map to store last interaction time per client
const lastInteractionTimes = new Map<string, number>(); 

// Use a Map to store context per client
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

        let lastInteractionTime = lastInteractionTimes.get(clientId) || Date.now();

        const botFunctions = [];

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

          lastInteractionTime = Date.now();
          lastInteractionTimes.set(clientId, lastInteractionTime);

          if (Date.now() - lastInteractionTime > sessionTimeout) {
            clientContexts.delete(clientId);
            lastInteractionTimes.delete(clientId);
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
        }

        processBots().catch((error) => {
          logger.error(
            `app/api/chat/route.ts [${requestId}] - Error in streaming bot interaction: ${error}`
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
      `app/api/chat/route.ts - Error in streaming bot interaction: ${error}`
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
