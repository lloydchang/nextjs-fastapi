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

// Helper function to randomize the order of personas
function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

// Function to safely escape special characters and format JSON for the stream
function safeStringify(obj: Record<string, string>): string {
  return JSON.stringify(obj)
    .replace(/\n/g, "\\n") // Escape newlines
    .replace(/[\u2028\u2029]/g, ""); // Remove problematic Unicode characters
}

async function createCombinedStream(messages: Array<{ persona: string, message: string }>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of messages) {
          // Use the safeStringify function to escape special characters
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

    // Include only the most recent 2-3 messages (adjust this number as needed)
    const recentMessages = messages.slice(-3);

    let conversationContext = recentMessages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
      .join('\n');

    conversationContext = `${systemPrompt}\n\n${conversationContext}\nAssistant:`;
    logger.silly(`app/api/chat/route.ts - Initialized recent conversation context: ${conversationContext}`);

    const responseFunctions = [
      { persona: 'Eliza', generate: () => generateElizaResponse([...messages]) },
      { persona: 'Alice', generate: () => generateAliceResponse([...messages]) },
      {
        persona: 'Gemma',
        generate: () =>
          config.ollamaGemmaTextModel
            ? handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config)
            : Promise.resolve("Out of office. Ollama Gemma Text Model is not defined in the configuration."),
      },
    ];

    // Shuffle the response order
    const shuffledResponses = shuffleArray(responseFunctions);

    // Execute the requests in random order
    const results = await Promise.allSettled(shuffledResponses.map((res) => res.generate()));

    const responses: Array<{ persona: string, message: string }> = [];

    results.forEach((result, index) => {
      const { persona } = shuffledResponses[index];
      if (result.status === 'fulfilled') {
        const newResponse = result.value;
        if (newResponse !== lastResponses[persona]) {
          responses.push({ persona, message: newResponse });
          lastResponses[persona] = newResponse;
        }
      } else {
        const errorResponse = `${persona} is unavailable: ${result.reason}`;
        responses.push({ persona, message: errorResponse });
      }
    });

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
