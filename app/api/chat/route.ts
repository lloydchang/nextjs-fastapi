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
import jsesc from 'jsesc';

// Type Guard to ensure the result is fulfilled with a non-null, non-empty string
function isFulfilledStringResult(
  result: PromiseSettledResult<string | null>
): result is PromiseFulfilledResult<string> {
  return (
    result.status === 'fulfilled' &&
    typeof result.value === 'string' &&
    result.value.trim() !== ''
  );
}

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    logger.debug(`app/api/chat/route.ts - Handling POST request`);

    const { messages } = await request.json();
    logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

    if (!Array.isArray(messages)) {
      logger.warn(`app/api/chat/route.ts - Invalid request format: messages is not an array.`);
      return NextResponse.json(
        { error: 'Invalid request format. "messages" must be an array.' },
        { status: 400 }
      );
    }

    const recentMessages = messages.slice(-3);

    const responseFunctions = [
      {
        persona: 'Ollama Gemma',
        generate: () =>
          config.ollamaGemmaTextModel
            ? handleTextWithOllamaGemmaTextModel(
                { userPrompt: buildPrompt(recentMessages), textModel: config.ollamaGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Cloudflare Gemma',
        generate: () =>
          config.cloudflareGemmaTextModel
            ? handleTextWithCloudflareGemmaTextModel(
                { userPrompt: buildPrompt(recentMessages), textModel: config.cloudflareGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Google Vertex Gemma',
        generate: () =>
          config.googleVertexGemmaTextModel
            ? handleTextWithGoogleVertexGemmaTextModel(
                { userPrompt: buildPrompt(recentMessages), textModel: config.googleVertexGemmaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Ollama Llama',
        generate: () =>
          config.ollamaLlamaTextModel
            ? handleTextWithOllamaLlamaTextModel(
                { userPrompt: buildPrompt(recentMessages), textModel: config.ollamaLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Cloudflare Llama',
        generate: () =>
          config.cloudflareLlamaTextModel
            ? handleTextWithCloudflareLlamaTextModel(
                { userPrompt: buildPrompt(recentMessages), textModel: config.cloudflareLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
      {
        persona: 'Google Vertex Llama',
        generate: () =>
          config.googleVertexLlamaTextModel
            ? handleTextWithGoogleVertexLlamaTextModel(
                { userPrompt: buildPrompt(recentMessages), textModel: config.googleVertexLlamaTextModel },
                config
              )
            : Promise.resolve(null),
      },
    ];

    const personaMap = responseFunctions.map((res) => res.persona);

    const results = await Promise.allSettled(responseFunctions.map((res) => res.generate()));

    const validResponses: Array<{ persona: string; message: string }> = [];

    results.forEach((result, index) => {
      if (isFulfilledStringResult(result)) {
        validResponses.push({
          persona: personaMap[index],
          message: result.value,
        });
      }
    });

    let responses: Array<{ persona: string; message: string }> = [];

    if (validResponses.length > 0) {
      responses = validResponses;
    } else {
      logger.silly(`app/api/chat/route.ts - No valid responses, using Eliza as fallback.`);
      const elizaResponse = await generateElizaResponse([
        { role: 'system', content: systemPrompt },
        ...recentMessages,
      ]);
      responses.push({ persona: 'Eliza', message: elizaResponse });
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

// Build the prompt using the system prompt and user messages
function buildPrompt(messages: Array<{ role: string; content: string }>): string {
  const filteredContext = createFilteredContext(messages);
  return `${systemPrompt}\n\n${filteredContext}\n\nUser Prompt:`;
}

// Create filtered context based on user messages without persona exceptions
function createFilteredContext(
  messages: Array<{ role: string; content: string }>
): string {
  return messages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'System'}: ${sanitizeInput(msg.content)}`)
    .join('\n');
}

// Function to create a combined stream for responses
async function createCombinedStream(messages: Array<{ persona: string; message: string }>) {
  const encoder = new TextEncoder();
  const validMessages = messages.filter(({ message }) => message && message.trim() !== '');

  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of validMessages) {
          const formattedMessage = jsesc({ persona, message }, { json: true });
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
