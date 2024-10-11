// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from 'app/api/chat/utils/config';
import { generateElizaResponse } from 'app/api/chat/utils/eliza';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaController';
import { handleTextWithGoogleVertexGemmaTextModel } from 'app/api/chat/controllers/GoogleVertexGemmaController';
import { handleTextWithOllamaLlamaTextModel } from 'app/api/chat/controllers/OllamaLlamaController';
import { handleTextWithCloudflareLlamaTextModel } from 'app/api/chat/controllers/CloudflareLlamaController';
import { handleTextWithGoogleVertexLlamaTextModel } from 'app/api/chat/controllers/GoogleVertexLlamaController';
import { randomlyTruncateSentences } from 'app/api/chat/utils/truncate';
import { buildPrompt } from 'app/api/chat/utils/promptBuilder';
import { createCombinedStream } from 'app/api/chat/utils/stream';
import logger from 'app/api/chat/utils/logger';

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
    }

    let context = messages.slice(-7); // Most recent 7 messages for initial context
    const botResponses: Array<{ persona: string; message: string }> = [];

    // Define bot personas and their generation functions
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

    // Set a maximum number of iterations to control the conversation length
    const maxIterations = 10;
    let iteration = 0;

    // Autonomous conversational loop
    while (iteration < maxIterations) {
      iteration++;
      logger.silly(`Iteration ${iteration}: Current context: ${JSON.stringify(context)}`);

      // Array to store each bot's response in the current iteration
      const responsesInThisIteration: Array<{ persona: string; message: string }> = [];

      // Run all bots concurrently, each generating a response based on the shared context
      const responses = await Promise.all(
        botFunctions.map((bot) => bot.generate(context))
      );

      // Process responses and add them to the shared context if valid
      responses.forEach((response, index) => {
        if (response && typeof response === 'string') {
          // Truncate the bot's response before adding to the shared context
          const truncatedResponse = randomlyTruncateSentences(response);
          const botPersona = botFunctions[index].persona;

          logger.silly(`Bot ${botPersona} generated response: ${truncatedResponse}`);
          context.push({ role: 'bot', content: truncatedResponse, persona: botPersona });
          responsesInThisIteration.push({ persona: botPersona, message: truncatedResponse });
        }
      });

      // If no bots generated a response, end the loop early
      if (responsesInThisIteration.length === 0) {
        logger.silly(`No bot responded in iteration ${iteration}. Ending interaction.`);
        break;
      }

      // Collect responses for final output
      botResponses.push(...responsesInThisIteration);
    }

    // Fallback to Eliza if no bot responses were generated
    if (botResponses.length === 0) {
      const elizaResponse = randomlyTruncateSentences(await generateElizaResponse([
        { role: 'system', content: 'The conversation has started.' },
        ...context,
      ]));
      logger.silly(`Eliza's fallback response: ${elizaResponse}`);
      botResponses.push({ persona: 'Eliza', message: elizaResponse });
    }

    // Create a combined stream of the collected bot responses
    const combinedStream = await createCombinedStream(botResponses);
    return new NextResponse(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    logger.error(`Error in autonomous bot interaction: ${error}`);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
