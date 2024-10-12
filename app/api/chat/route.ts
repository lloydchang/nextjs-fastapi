// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaController';
import { handleTextWithGoogleVertexGemmaTextModel } from 'app/api/chat/controllers/GoogleVertexGemmaController';
import { handleTextWithOllamaLlamaTextModel } from 'app/api/chat/controllers/OllamaLlamaController';
import { handleTextWithCloudflareLlamaTextModel } from 'app/api/chat/controllers/CloudflareLlamaController';
import { handleTextWithGoogleVertexLlamaTextModel } from 'app/api/chat/controllers/GoogleVertexLlamaController';
import { buildPrompt } from 'app/api/chat/utils/promptBuilder';
import logger from 'app/api/chat/utils/logger';
import { UserPrompt, Message } from 'types';

/**
 * Defines the structure for each bot function.
 */
type BotFunction = {
  persona: string;
  valid: boolean;
  generate: (this: BotFunction, currentContext: UserPrompt[]) => Promise<string | null>;
};

const config = getConfig();
const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout to reset context after inactivity
const maxContextMessages = 20; // Keep only the last 20 bot messages in the running context

let lastInteractionTime = Date.now(); // Track the last interaction time for session reset

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as { messages: Message[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request format or no messages provided.' },
        { status: 400 }
      );
    }

    // Extract the last 7 user messages and convert them to UserPrompt format
    let context: UserPrompt[] = messages
      .filter(msg => msg.sender === 'user')
      .slice(-7)
      .map(msg => ({ role: 'user', content: msg.text }));

    // Create a ReadableStream to send responses to the client in real-time
    const stream = new ReadableStream({
      async start(controller) {
        logger.silly(`app/api/chat/route.ts - Started streaming responses to the client.`);

        // Initialize bot functions
        const botFunctions: BotFunction[] = [];

        // Helper function to add bots to the botFunctions array
        const addBot = (persona: string, handler: (this: BotFunction, currentContext: UserPrompt[]) => Promise<string | null>) => {
          botFunctions.push({
            persona,
            valid: true,
            generate: handler,
          });
        };

        // Add Ollama Gemma Bot
        addBot('Ollama Gemma', async function (currentContext: UserPrompt[]) {
          if (!this.valid || !config.ollamaGemmaTextModel) return null;
          try {
            const response = await handleTextWithOllamaGemmaTextModel(
              {
                userPrompt: [
                  { role: 'system', content: config.systemPrompt || 'Default system prompt' },
                  ...currentContext,
                ],
                textModel: config.ollamaGemmaTextModel,
              },
              config
            );
            return response;
          } catch (error) {
            this.valid = false;
            logger.error(`Ollama Gemma failed: ${error}`);
            return null;
          }
        });

        // Add Cloudflare Gemma Bot 
        addBot('Cloudflare Gemma', async function (currentContext: UserPrompt[]) {
          if (!this.valid || !config.cloudflareGemmaTextModel) return null;
          try {
            const response = await handleTextWithCloudflareGemmaTextModel(
              {
                userPrompt: [
                  { role: 'system', content: config.systemPrompt || 'Default system prompt' },
                  ...currentContext,
                ],
                textModel: config.cloudflareGemmaTextModel,
              },
              config
            );
            return response;
          } catch (error) {
            this.valid = false;
            logger.error(`Cloudflare Gemma failed: ${error}`);
            return null;
          }
        });

        // Add Google Vertex Gemma Bot
        addBot('Google Vertex Gemma', async function (currentContext: UserPrompt[]) {
          if (!this.valid || !config.googleVertexGemmaTextModel) return null;
          try {
            const response = await handleTextWithGoogleVertexGemmaTextModel(
              {
                userPrompt: [
                  { role: 'system', content: config.systemPrompt || 'Default system prompt' },
                  ...currentContext,
                ],
                textModel: config.googleVertexGemmaTextModel,
              },
              config
            );
            return response;
          } catch (error) {
            this.valid = false;
            logger.error(`Google Vertex Gemma failed: ${error}`);
            return null;
          }
        });

        // Add Ollama Llama Bot
        addBot('Ollama Llama', async function (currentContext: UserPrompt[]) {
          if (!this.valid || !config.ollamaLlamaTextModel) return null;
          try {
            const response = await handleTextWithOllamaLlamaTextModel(
              {
                userPrompt: [
                  { role: 'system', content: config.systemPrompt || 'Default system prompt' },
                  ...currentContext,
                ],
                textModel: config.ollamaLlamaTextModel,
              },
              config
            );
            return response;
          } catch (error) {
            this.valid = false;
            logger.error(`Ollama Llama failed: ${error}`);
            return null;
          }
        });

        // Add Cloudflare Llama Bot
        addBot('Cloudflare Llama', async function (currentContext: UserPrompt[]) {
          if (!this.valid || !config.cloudflareLlamaTextModel) return null;
          try {
            const response = await handleTextWithCloudflareLlamaTextModel(
              {
                userPrompt: [
                  { role: 'system', content: config.systemPrompt || 'Default system prompt' },
                  ...currentContext,
                ],
                textModel: config.cloudflareLlamaTextModel,
              },
              config
            );
            return response;
          } catch (error) {
            this.valid = false;
            logger.error(`Cloudflare Llama failed: ${error}`);
            return null;
          }
        });

        // Add Google Vertex Llama Bot
        addBot('Google Vertex Llama', async function (currentContext: UserPrompt[]) {
          if (!this.valid || !config.googleVertexLlamaTextModel) return null;
          try {
            const response = await handleTextWithGoogleVertexLlamaTextModel(
              {
                userPrompt: [
                  { role: 'system', content: config.systemPrompt || 'Default system prompt' },
                  ...currentContext,
                ],
                textModel: config.googleVertexLlamaTextModel,
              },
              config
            );
            return response;
          } catch (error) {
            this.valid = false;
            logger.error(`Google Vertex Llama failed: ${error}`);
            return null;
          }
        });

        // Set a maximum number of iterations to run
        let maxIterations = Infinity;
        // maxIterations = 1; // Uncomment for testing limited iterations

        let iteration = 0;

        // Processes all bots to generate responses based on the current context
        async function processBots() {
          while (iteration < maxIterations) {
            iteration++;
            logger.silly(`app/api/chat/route.ts - Iteration ${iteration}: Current context: ${JSON.stringify(context)}`);

            // Run all bots concurrently, each generating a response based on the shared context
            const responses = await Promise.all(
              botFunctions.map((bot) => (bot.valid ? bot.generate(context) : null))
            );

            // If no responses, end the loop early
            let hasResponse = false;

            // Process each bot response and add it to the context and stream
            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              if (response && typeof response === 'string') {
                const botPersona = botFunctions[index].persona;

                logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);

                // Add to the context for other bots to use
                context.push({ role: 'bot', content: response });

                // Stream this response immediately to the client with data prefix
                controller.enqueue(
                  `data: ${JSON.stringify({
                    persona: botPersona,
                    message: response,
                  })}\n\n`
                );

                hasResponse = true;
              }
            }

            // Limit context size to the last 20 bot messages
            context = context.slice(-maxContextMessages);

            // Reset context and session if the timeout (1 hour) is reached
            if (Date.now() - lastInteractionTime > sessionTimeout) {
              context = []; // Reset context after the session timeout
              lastInteractionTime = Date.now(); // Reset the interaction timer
              logger.silly(`app/api/chat/route.ts - Session timed out. Context reset.`);
            }

            // If no bots generated a response, terminate the loop
            if (!hasResponse) {
              logger.silly(
                `app/api/chat/route.ts - No bot responded in iteration ${iteration} of ${maxIterations}. Ending interaction.`
              );
              break;
            }
          }

          // Send a completion message to indicate the end of the stream
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
        }

        // Start the bot processing loop
        processBots().catch((error) => {
          logger.error(`app/api/chat/route.ts - Error in streaming bot interaction: ${error}`);
          controller.error(error);
        });
      },
    });

    // Return the streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error(`app/api/chat/route.ts - Error in streaming bot interaction: ${error}`);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }

    // Fallback for non-Error objects
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
