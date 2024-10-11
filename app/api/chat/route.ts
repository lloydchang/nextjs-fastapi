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
import { buildPrompt } from 'app/api/chat/utils/promptBuilder';
import { createCombinedStream } from 'app/api/chat/utils/stream';
import { randomlyTruncateSentences } from 'app/api/chat/utils/truncate';
import logger from 'app/api/chat/utils/logger';

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
    }

    // Start with the most recent user messages as the initial context
    let currentContext = messages.slice(-7); // Most recent 7 messages

    // Define bot personas and their generation functions
    const responseFunctions = [
      {
        persona: 'Ollama Gemma',
        generate: () =>
          config.ollamaGemmaTextModel
            ? handleTextWithOllamaGemmaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.ollamaGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Cloudflare Gemma',
        generate: () =>
          config.cloudflareGemmaTextModel
            ? handleTextWithCloudflareGemmaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.cloudflareGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Google Vertex Gemma',
        generate: () =>
          config.googleVertexGemmaTextModel
            ? handleTextWithGoogleVertexGemmaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.googleVertexGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Ollama Llama',
        generate: () =>
          config.ollamaLlamaTextModel
            ? handleTextWithOllamaLlamaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.ollamaLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Cloudflare Llama',
        generate: () =>
          config.cloudflareLlamaTextModel
            ? handleTextWithCloudflareLlamaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.cloudflareLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Google Vertex Llama',
        generate: () =>
          config.googleVertexLlamaTextModel
            ? handleTextWithGoogleVertexLlamaTextModel(
                { userPrompt: buildPrompt(currentContext), textModel: config.googleVertexLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
    ];

    // Sequentially process each bot response to enable interaction and apply truncation
    const responses: Array<{ persona: string; message: string }> = [];

    for (const res of responseFunctions) {
      logger.silly(`Processing response for persona: ${res.persona}`);
      const botResponse = await res.generate();

      if (botResponse && typeof botResponse === 'string') {
        // Apply truncation to the bot response before adding it to the context
        const truncatedMessage = randomlyTruncateSentences(botResponse);
        logger.silly(`Truncated response from ${res.persona}: ${truncatedMessage}`);

        // Add the truncated bot's response to the context
        currentContext.push({ role: 'bot', content: truncatedMessage, persona: res.persona });

        // Keep track of the truncated response for final output
        responses.push({ persona: res.persona, message: truncatedMessage });
      }
    }

    // Fallback to Eliza if no valid responses were generated
    if (responses.length === 0) {
      const elizaResponse = randomlyTruncateSentences(await generateElizaResponse([
        { role: 'system', content: systemPrompt },
        ...currentContext,
      ]));
      logger.silly(`Eliza's truncated response: ${elizaResponse}`);
      responses.push({ persona: 'Eliza', message: elizaResponse });
    }

    // Create a combined stream and return
    const combinedStream = await createCombinedStream(responses);
    return new NextResponse(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    logger.error(`Error in bot interaction: ${error}`);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
