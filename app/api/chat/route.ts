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

// Utility function to randomly select a section from the text with 1 or 2 sentences
function randomlyTruncateSentences(text: string): string {
  // Regular expression to capture sentences and special phrases like "(Applause)" or "(Laughter)"
  const sentencePattern = /[^.!?]*[.!?]+|[(][^)]*[)]/g;
  const sentences = text.match(sentencePattern) || [];

  if (sentences.length === 0) return text; // If no sentences are found, return the original text

  // Choose a random starting index for truncation
  const startIndex = Math.floor(Math.random() * sentences.length);

  // Choose 1 or 2 sentences to include after the starting index
  const numSentencesToInclude = Math.floor(Math.random() * 2) + 1; // Randomly choose between 1 and 2

  // Extract the selected range of sentences
  const truncatedSentences = sentences.slice(startIndex, startIndex + numSentencesToInclude);

  return truncatedSentences.join(' ').trim();
}

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
    .map((msg) => {
      if (!msg.content) {
        logger.error(`app/api/chat/route.ts - Invalid message content: ${JSON.stringify(msg)}`);
        return ''; // Skip invalid messages
      }
      return msg.content;
    })
    .join('\n');  // Ensure the `join` is correctly aligned and closes the map.
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
          logger.silly(`app/api/chat/route.ts - Streaming message: ${formattedMessage}`);
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
