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
import { sanitizeInput } from 'app/api/chat/utils/sanitize';
import { systemPrompt } from 'app/api/chat/utils/prompt';
import logger from 'app/api/chat/utils/logger';

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    logger.debug(`app/api/chat/route.ts - Handling POST request`);

    const { messages } = await request.json();
    logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

    if (!Array.isArray(messages)) {
      logger.warn(`app/api/chat/route.ts - Invalid request format: messages is not an array.`);
      return NextResponse.json({ error: 'Invalid request format. "messages" must be an array.' }, { status: 400 });
    }

    const recentMessages = messages.slice(-3);  // Define recentMessages here

    // Define responseFunctions after recentMessages is declared
    const responseFunctions = [
      {
        persona: 'Ollama Gemma',
        generate: () => {
          const gemmaContext = createFilteredContext('Gemma', recentMessages);
          return config.ollamaGemmaTextModel
            ? handleTextWithOllamaGemmaTextModel({ userPrompt: gemmaContext, textModel: config.ollamaGemmaTextModel }, config)
            : Promise.resolve(null);
        },
      },
      {
        persona: 'Cloudflare Gemma',
        generate: () => {
          const gemmaContext = createFilteredContext('Gemma', recentMessages);
          return config.cloudflareGemmaTextModel
            ? handleTextWithCloudflareGemmaTextModel({ userPrompt: gemmaContext, textModel: config.cloudflareGemmaTextModel }, config)
            : Promise.resolve(null);
        },
      },
      {
        persona: 'Google Vertex Gemma',
        generate: () => {
          const gemmaContext = createFilteredContext('Gemma', recentMessages);
          return config.googleVertexGemmaTextModel
            ? handleTextWithGoogleVertexGemmaTextModel({ userPrompt: gemmaContext, textModel: config.googleVertexGemmaTextModel }, config)
            : Promise.resolve(null);
        },
      },
      {
        persona: 'Ollama Llama',
        generate: () => {
          const llamaContext = createFilteredContext('Llama', recentMessages);
          return config.ollamaLlamaTextModel
            ? handleTextWithOllamaLlamaTextModel({ userPrompt: llamaContext, textModel: config.ollamaLlamaTextModel }, config)
            : Promise.resolve(null);
        },
      },
      {
        persona: 'Cloudflare Llama',
        generate: () => {
          const llamaContext = createFilteredContext('Llama', recentMessages);
          return config.cloudflareLlamaTextModel
            ? handleTextWithCloudflareLlamaTextModel({ userPrompt: llamaContext, textModel: config.cloudflareLlamaTextModel }, config)
            : Promise.resolve(null);
        },
      },
      {
        persona: 'Google Vertex Llama',
        generate: () => {
          const llamaContext = createFilteredContext('Llama', recentMessages);
          return config.googleVertexLlamaTextModel
            ? handleTextWithGoogleVertexLlamaTextModel({ userPrompt: llamaContext, textModel: config.googleVertexLlamaTextModel }, config)
            : Promise.resolve(null);
        },
      },
    ];

    const results = await Promise.allSettled(responseFunctions.map((res) => res.generate()));

    // Type Guard to filter fulfilled results and ensure non-null and non-empty responses
    const gemmaResponses = results.filter(
      (res): res is PromiseFulfilledResult<string | null> =>
        res.status === 'fulfilled' && res.value !== null && res.value.trim() !== ''
    );

    let responses: Array<{ persona: string, message: string }> = [];

    if (gemmaResponses.length === 0) {
      const elizaResponse = await generateElizaResponse([{ role: 'system', content: systemPrompt }, ...recentMessages]);
      responses.push({ persona: 'Eliza', message: elizaResponse });
    } else {
      responses = gemmaResponses.map((result, index) => ({
        persona: responseFunctions[index].persona,
        message: result.value!,
      }));
    }

    const combinedStream = await createCombinedStream(responses);
    return new NextResponse(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    logger.error(`app/api/chat/route.ts - Error: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function createFilteredContext(persona: string, messages: Array<{ role: string; content: string; persona?: string }>) {
  return messages
    .filter((msg) => msg.persona !== persona)
    .map((msg) => {
      const contentWithoutPersonaName = msg.content.replace(new RegExp(persona, 'gi'), '');
      return `${msg.role === 'user' ? 'User' : msg.persona}: ${sanitizeInput(contentWithoutPersonaName)}`;
    })
    .join('\n');
}

async function createCombinedStream(messages: Array<{ persona: string, message: string }>) {
  const encoder = new TextEncoder();

  // Filter out empty or null messages to prevent streaming empty content.
  const validMessages = messages.filter(({ message }) => message && message.trim() !== '');

  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of validMessages) {
          const formattedMessage = JSON.stringify({ persona, message }).replace(/\n/g, "\\n").replace(/[\u2028\u2029]/g, "");
          controller.enqueue(encoder.encode(`data: ${formattedMessage}\n\n`));
          logger.debug(`app/api/chat/route.ts - Streaming message: ${formattedMessage}`);
        }
        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        logger.error(`app/api/chat/route.ts - Error in stream: ${errorMessage}`);
        controller.enqueue(encoder.encode(`data: {"error": "${errorMessage}"}\n\n`));
        controller.close();
      }
    },
  });
}
