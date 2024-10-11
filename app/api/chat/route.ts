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
import { systemPrompt } from 'app/api/chat/utils/systemPrompt';
import logger from 'app/api/chat/utils/logger';
import jsesc from 'jsesc';

import { randomlyTruncateSentences } from 'app/api/chat/utils/truncate';
import { isFulfilledStringResult } from 'app/api/chat/utils/validation';
import { buildPrompt, createFilteredContext } from 'app/api/chat/utils/promptBuilder';
import { createCombinedStream } from 'app/api/chat/utils/stream';

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    logger.silly(`app/api/chat/route.ts - Handling POST request`);

    // Parse the incoming request
    const { messages } = await request.json();
    logger.silly(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

    // Validate messages
    if (!Array.isArray(messages)) {
      logger.silly(`app/api/chat/route.ts - Invalid request format: messages is not an array.`);
      return NextResponse.json(
        { error: 'Invalid request format. "messages" must be an array.' },
        { status: 400 }
      );
    }

    // Check if messages are empty
    if (messages.length === 0) {
      logger.silly(`app/api/chat/route.ts - No messages received.`);
      return NextResponse.json(
        { error: 'No messages provided.' },
        { status: 400 }
      );
    }

    const invalidMessages = messages.filter(msg => {
      logger.silly(`app/api/chat/route.ts - Validating message: ${JSON.stringify(msg)}`);
      const isInvalid = typeof msg !== 'object' || msg === null || 
                        typeof msg.role !== 'string' || msg.role.trim() === '' ||
                        typeof msg.content !== 'string' || msg.content.trim() === '';
      if (isInvalid) {
        logger.error(`app/api/chat/route.ts - Invalid message content: ${JSON.stringify(msg)}`);
      }
      return isInvalid;
    });

    if (invalidMessages.length > 0) {
      logger.silly(`app/api/chat/route.ts - Invalid messages detected: ${JSON.stringify(invalidMessages)}`);
      return NextResponse.json(
        { error: 'One or more messages are invalid.' },
        { status: 400 }
      );
    }

    const recentMessages = messages.slice(-7); // 7 most recent messages
    logger.silly(`app/api/chat/route.ts - Recent messages for context: ${JSON.stringify(recentMessages)}`);

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
    logger.silly(`app/api/chat/route.ts - Response functions prepared: ${JSON.stringify(personaMap)}`);

    const results = await Promise.allSettled(responseFunctions.map((res) => res.generate()));

    const validResponses: Array<{ persona: string; message: string }> = [];

    results.forEach((result, index) => {
      if (isFulfilledStringResult(result)) {
        validResponses.push({
          persona: personaMap[index],
          message: randomlyTruncateSentences(result.value), // Apply the random truncation here
        });
      }
    });

    let responses: Array<{ persona: string; message: string }> = [];

    if (validResponses.length > 0) {
      responses = validResponses;
    } else {
      logger.silly(`app/api/chat/route.ts - No valid responses, using Eliza as fallback.`);
      const elizaResponse = randomlyTruncateSentences(await generateElizaResponse([
        { role: 'system', content: systemPrompt },
        ...recentMessages,
      ]));
      responses.push({ persona: 'Eliza', message: elizaResponse });
    }

    const combinedStream = await createCombinedStream(responses);
    logger.silly(`app/api/chat/route.ts - Valid responses: ${JSON.stringify(responses)}`);
    return new NextResponse(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    logger.error(`app/api/chat/route.ts - Error: ${errorMessage}`, { stack: error instanceof Error ? error.stack : null });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
