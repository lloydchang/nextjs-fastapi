// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { generateElizaResponse } from './utils/eliza';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from './controllers/CloudflareGemmaController';
import { handleTextWithGoogleVertexGemmaTextModel } from './controllers/GoogleVertexGemmaController';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/logger';

const config = getConfig();

const lastResponses: { [key: string]: string } = {};

function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

function safeStringify(obj: Record<string, string>): string {
  return JSON.stringify(obj)
    .replace(/\n/g, "\\n")
    .replace(/[\u2028\u2029]/g, "");
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
  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of messages) {
          const formattedMessage = safeStringify({ persona, message });
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

export async function POST(request: NextRequest) {
  try {
    logger.debug(`app/api/chat/route.ts - Handling POST request`);

    const { messages } = await request.json();
    logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

    if (!Array.isArray(messages)) {
      logger.warn(`app/api/chat/route.ts - Invalid request format: messages is not an array.`);
      return NextResponse.json({ error: 'Invalid request format. "messages" must be an array.' }, { status: 400 });
    }

    const recentMessages = messages.slice(-3);

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
    ];

    const results = await Promise.allSettled(responseFunctions.map((res) => res.generate()));

    const gemmaResponses = results.filter(res => res.status === 'fulfilled' && res.value !== null);
    
    let responses: Array<{ persona: string, message: string }> = [];

    if (gemmaResponses.length === 0) {
      const elizaResponse = await generateElizaResponse([{ role: 'system', content: systemPrompt }, ...recentMessages]);
      responses.push({ persona: 'Eliza', message: elizaResponse });
    } else {
      responses = gemmaResponses.map((result, index) => ({
        persona: responseFunctions[index].persona,
        message: result.value,
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
