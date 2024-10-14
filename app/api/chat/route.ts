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

    let context = messages.slice(-7); // Start with the last 7 user messages for a new context

    const stream = new ReadableStream({
      async start(controller) {
        logger.silly(`app/api/chat/route.ts - Started streaming responses to the client.`);

        const botFunctions = [
          {
            persona: 'Ollama ' + config.ollamaGemmaTextModel,
            generate: (currentContext: any[]) =>
              handleTextWithOllamaGemmaTextModel(
                { userPrompt: extractValidMessages(currentContext), textModel: config.ollamaGemmaTextModel },
                config
              ),
            isValid: !!config.ollamaGemmaTextModel,
          },
          {
            persona: 'Cloudflare ' + config.cloudflareGemmaTextModel,
            generate: (currentContext: any[]) =>
              handleTextWithCloudflareGemmaTextModel(
                { userPrompt: extractValidMessages(currentContext), textModel: config.cloudflareGemmaTextModel },
                config
              ),
            isValid: !!config.cloudflareGemmaTextModel,
          },
          {
            persona: 'Google Vertex ' + config.googleVertexGemmaTextModel,
            generate: (currentContext: any[]) =>
              handleTextWithGoogleVertexGemmaTextModel(
                { userPrompt: extractValidMessages(currentContext), textModel: config.googleVertexGemmaTextModel },
                config
              ),
            isValid: !!config.googleVertexGemmaTextModel,
          },
          {
            persona: 'Ollama ' + config.ollamaLlamaTextModel,
            generate: (currentContext: any[]) =>
              handleTextWithOllamaLlamaTextModel(
                { userPrompt: extractValidMessages(currentContext), textModel: config.ollamaLlamaTextModel },
                config
              ),
            isValid: !!config.ollamaLlamaTextModel,
          },
          {
            persona: 'Cloudflare ' + config.cloudflareLlamaTextModel,
            generate: (currentContext: any[]) =>
              handleTextWithCloudflareLlamaTextModel(
                { userPrompt: extractValidMessages(currentContext), textModel: config.cloudflareLlamaTextModel },
                config
              ),
            isValid: !!config.cloudflareLlamaTextModel,
          },
          {
            persona: 'Google Vertex ' + config.googleVertexLlamaTextModel,
            generate: (currentContext: any[]) =>
              handleTextWithGoogleVertexLlamaTextModel(
                { userPrompt: extractValidMessages(currentContext), textModel: config.googleVertexLlamaTextModel },
                config
              ),
            isValid: !!config.googleVertexLlamaTextModel,
          },
        ].filter(bot => bot.isValid); // Only keep valid bot configurations

        async function processBots() {
          logger.silly(`app/api/chat/route.ts - Starting parallel bot processing`);

          // Fetch all bot responses in parallel
          const responses = await Promise.all(
            botFunctions.map((bot, index) => {
              logger.silly(`app/api/chat/route.ts - Starting parallel bot processing for ${bot.persona}`);
              return bot.generate(context);
            })
          );

          let hasResponse = false;

          // Process the bot responses
          for (let index = 0; index < responses.length; index++) {
            const response = responses[index];
            if (response && typeof response === 'string') {
              const botPersona = botFunctions[index].persona;

              logger.debug(`app/api/chat/route.ts - Response from ${botPersona}: ${response}`);

              context.push({ role: 'bot', content: response, persona: botPersona });

              // Send the bot response to the client immediately
              controller.enqueue(`data: ${JSON.stringify({
                persona: botPersona,
                message: response,
              })}\n\n`);

              hasResponse = true;
            }
          }

          // Keep context within limits
          context = context.slice(-maxContextMessages);

          if (Date.now() - lastInteractionTime > sessionTimeout) {
            context = [];
            lastInteractionTime = Date.now();
            logger.silly(`app/api/chat/route.ts - Session timed out. Context reset.`);
          }

          if (!hasResponse) {
            logger.silly(`app/api/chat/route.ts - No bot responded. Ending interaction.`);
          }

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
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    logger.error(`app/api/chat/route.ts - Error in streaming bot interaction: ${error}`);

    return error instanceof Error
      ? NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
      : NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
