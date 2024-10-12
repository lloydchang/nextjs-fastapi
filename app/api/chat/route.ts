// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
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
const sessionTimeout = 60 * 60 * 1000; // 1-hour timeout to reset context after inactivity
const maxContextMessages = 20; // Keep only the last 20 bot messages in the running context

let lastInteractionTime = Date.now(); // Track the last interaction time for session reset

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
    }

    // Initial context includes recent user messages only
    let context = messages.slice(-7); // Start with the last 7 user messages for a new context

    // Create a ReadableStream to send responses to the client in real-time
    const stream = new ReadableStream({
      async start(controller) {
        logger.silly(`app/api/chat/route.ts - Started streaming responses to the client.`);

        // Define bot personas and their generation functions
        const botFunctions = [
          {
            persona: 'Ollama ' + config.ollamaGemmaTextModel,
            generate: (currentContext: any[]) =>
              config.ollamaGemmaTextModel
                ? handleTextWithOllamaGemmaTextModel(
                    { userPrompt: extractValidMessages(currentContext), textModel: config.ollamaGemmaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Cloudflare ' + config.cloudflareGemmaTextModel,
            generate: (currentContext: any[]) =>
              config.cloudflareGemmaTextModel
                ? handleTextWithCloudflareGemmaTextModel(
                    { userPrompt: extractValidMessages(currentContext), textModel: config.cloudflareGemmaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Google Vertex ' + config.googleVertexGemmaTextModel,
            generate: (currentContext: any[]) =>
              config.googleVertexGemmaTextModel
                ? handleTextWithGoogleVertexGemmaTextModel(
                    { userPrompt: extractValidMessages(currentContext), textModel: config.googleVertexGemmaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Ollama ' + config.ollamaLlamaTextModel,
            generate: (currentContext: any[]) =>
              config.ollamaLlamaTextModel
                ? handleTextWithOllamaLlamaTextModel(
                    { userPrompt: extractValidMessages(currentContext), textModel: config.ollamaLlamaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Cloudflare ' + config.cloudflareLlamaTextModel,
            generate: (currentContext: any[]) =>
              config.cloudflareLlamaTextModel
                ? handleTextWithCloudflareLlamaTextModel(
                    { userPrompt: extractValidMessages(currentContext), textModel: config.cloudflareLlamaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Google Vertex ' + config.googleVertexLlamaTextModel,
            generate: (currentContext: any[]) =>
              config.googleVertexLlamaTextModel
                ? handleTextWithGoogleVertexLlamaTextModel(
                    { userPrompt: extractValidMessages(currentContext), textModel: config.googleVertexLlamaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
        ];

        // Set a maximum number of iterations to run
        let maxIterations = Infinity;
        // maxIterations = 1; // Uncomment for testing limited iterations

        let iteration = 0;

        async function processBots() {
          while (iteration < maxIterations) {
            iteration++;
            logger.silly(`app/api/chat/route.ts - Iteration ${iteration}: Current context: ${JSON.stringify(context)}`);

            // Run all bots concurrently, each generating a response based on the shared context
            const responses = await Promise.all(
              botFunctions.map((bot) => bot.generate(context))
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
                context.push({ role: 'bot', content: response, persona: botPersona });

                // Stream this response immediately to the client with data prefix
                controller.enqueue(`data: ${JSON.stringify({
                  persona: botPersona,
                  message: response,
                })}\n\n`);

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
              logger.silly(`app/api/chat/route.ts - No bot responded in iteration ${iteration} of ${maxIterations}. Ending interaction.`);
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
        'Connection': 'keep-alive',
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
