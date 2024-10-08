// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { generateElizaResponse } from './utils/eliza';
import { generateAliceResponse } from './utils/alice';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/logger';

const config = getConfig();

const lastResponses: { [key: string]: string } = {};

async function createCombinedStream(messages: Array<{ persona: string, message: string }>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of messages) {
          // Safely encode the message using JSON.stringify
          const formattedMessage = JSON.stringify({ persona, message });
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

    let conversationContext = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
      .join('\n');

    conversationContext = `${systemPrompt}\n\n${conversationContext}\nAssistant:`;
    logger.silly(`app/api/chat/route.ts - Initialized conversation context: ${conversationContext}`);

    const responses: Array<{ persona: string, message: string }> = [];

    const [elizaResult, aliceResult, gemmaResult] = await Promise.allSettled([
      generateElizaResponse([...messages]),
      generateAliceResponse([...messages]),
      config.ollamaGemmaTextModel
        ? handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config)
        : Promise.resolve("Out of office. Ollama Gemma Text Model is not defined in the configuration."),
    ]);

    if (elizaResult.status === 'fulfilled') {
      const newResponse = elizaResult.value;
      if (newResponse !== lastResponses['Eliza']) {
        responses.push({ persona: 'Eliza', message: newResponse });
        lastResponses['Eliza'] = newResponse;
      }
    } else {
      const elizaError = `Eliza is unavailable: ${elizaResult.reason}`;
      responses.push({ persona: 'Eliza', message: elizaError });
    }

    if (aliceResult.status === 'fulfilled') {
      const newResponse = aliceResult.value;
      if (newResponse !== lastResponses['Alice']) {
        responses.push({ persona: 'Alice', message: newResponse });
        lastResponses['Alice'] = newResponse;
      }
    } else {
      const aliceError = `Alice is unavailable: ${aliceResult.reason}`;
      responses.push({ persona: 'Alice', message: aliceError });
    }

    if (gemmaResult.status === 'fulfilled') {
      const newResponse = gemmaResult.value;
      if (newResponse !== lastResponses['Gemma']) {
        responses.push({ persona: 'Gemma', message: newResponse });
        lastResponses['Gemma'] = newResponse;
      }
    } else {
      const gemmaError = `Gemma is unavailable: ${gemmaResult.reason}`;
      responses.push({ persona: 'Gemma', message: gemmaError });
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
