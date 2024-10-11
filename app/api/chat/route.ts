// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaController';
import { handleTextWithGoogleVertexGemmaTextModel } from 'app/api/chat/controllers/GoogleVertexGemmaController';
import { handleTextWithOllamaLlamaTextModel } from 'app/api/chat/controllers/OllamaLlamaController';
import { handleTextWithCloudflareLlamaTextModel } from 'app/api/chat/controllers/CloudflareLlamaController';
import { handleTextWithGoogleVertexLlamaTextModel } from 'app/api/chat/controllers/GoogleVertexLlamaController';
import { randomlyTruncateSentences } from 'app/api/chat/utils/truncate';
import { buildPrompt } from 'app/api/chat/utils/promptBuilder';
import logger from 'app/api/chat/utils/logger';
import { AppError } from './types/ErrorTypes'; // Import the custom error type

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    const { messages, enableTruncation = false } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
    }

    // Initialize userMessages with the system prompt and up to 7 recent user messages.
    const systemPrompt = messages[0]; // The first message is always the system prompt.
    const recentUserMessages = messages.slice(1, 8).filter((msg) => msg.role === 'user'); // Up to 7 user messages.
    const userMessages = [systemPrompt, ...recentUserMessages]; // Combine system prompt and user messages.

    // Create a dynamic context to handle the evolving bot dialogue.
    let botDialogue = [...userMessages];

    // Define bot personas and their generation functions.
    const botFunctions = [
      {
        persona: 'Ollama Gemma',
        generate: (currentContext: any[]) =>
          config.ollamaGemmaTextModel
            ? handleTextWithOllamaGemmaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.ollamaGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Cloudflare Gemma',
        generate: (currentContext: any[]) =>
          config.cloudflareGemmaTextModel
            ? handleTextWithCloudflareGemmaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.cloudflareGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Google Vertex Gemma',
        generate: (currentContext: any[]) =>
          config.googleVertexGemmaTextModel
            ? handleTextWithGoogleVertexGemmaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.googleVertexGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Ollama Llama',
        generate: (currentContext: any[]) =>
          config.ollamaLlamaTextModel
            ? handleTextWithOllamaLlamaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.ollamaLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Cloudflare Llama',
        generate: (currentContext: any[]) =>
          config.cloudflareLlamaTextModel
            ? handleTextWithCloudflareLlamaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.cloudflareLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Google Vertex Llama',
        generate: (currentContext: any[]) =>
          config.googleVertexLlamaTextModel
            ? handleTextWithGoogleVertexLlamaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.googleVertexLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
    ];

    // Set a maximum number of iterations to control conversation length.
    const maxIterations = 10;
    let iteration = 0;

    // Create a ReadableStream to send responses to the client in real-time.
    const stream = new ReadableStream({
      async start(controller) {
        logger.silly(`Started streaming responses to the client.`);

        async function processBots() {
          while (iteration < maxIterations) {
            iteration++;
            logger.silly(`Iteration ${iteration}: Current botDialogue: ${JSON.stringify(botDialogue)}`);

            // Run all bots concurrently, each generating a response based on the shared botDialogue.
            const responses = await Promise.all(
              botFunctions.map((bot) => bot.generate(botDialogue))
            );

            // Process each bot response, optionally truncate it, and add it to the context and stream.
            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              if (response && typeof response === 'string') {
                // Apply truncation if enabled, otherwise use the full response.
                const finalResponse = enableTruncation ? randomlyTruncateSentences(response) : response;
                const botPersona = botFunctions[index].persona;

                logger.silly(`Response from ${botPersona}: ${finalResponse}`);

                // Add to the botDialogue for subsequent bot iterations to reference.
                botDialogue.push({ role: 'bot', content: finalResponse, persona: botPersona });

                // Stream this response immediately to the client with data prefix.
                controller.enqueue(
                  `data: ${JSON.stringify({
                    persona: botPersona,
                    message: finalResponse,
                  })}\n\n`
                );
              }
            }

            // If no bots generated a response, terminate the loop.
            if (responses.every((res) => !res)) {
              logger.silly(`No bot responded in iteration ${iteration}. Ending interaction.`);
              break;
            }
          }

          // Send a completion message to indicate the end of the stream.
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
        }

        // Start the bot processing loop.
        processBots().catch((error: AppError) => {
          const errorMessage: string = error instanceof Error ? error.message : 'Unknown error occurred';
          logger.error(`Error in streaming bot interaction: ${errorMessage}`);
          controller.error(error);
        });
      },
    });

    // Return the streaming response.
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Internal Server Error';
    logger.error(`Error in streaming bot interaction: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
