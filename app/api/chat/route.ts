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

// Store the last response for each persona
const lastResponses: { [key: string]: string } = {};

/**
 * Function to sanitize JSON strings to prevent errors from malformed data.
 * Escapes special characters like double quotes, backslashes, newlines, and tabs.
 */
function sanitizeJSON(jsonString: string): string {
  return jsonString
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t')    // Escape tabs
    .replace(/'/g, "\\'");    // Escape single quotes
}

async function createCombinedStream(messages: Array<{ persona: string, message: string }>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of messages) {
          // Use sanitized message for safe JSON streaming
          const sanitizedMessage = sanitizeJSON(message);
          logger.debug(`app/api/chat/route.ts - Streaming sanitized message from ${persona}: ${sanitizedMessage}`);
          controller.enqueue(encoder.encode(`data: {"persona": "${persona}", "message": "${sanitizedMessage}"}\n\n`));
        }
        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        logger.error(`app/api/chat/route.ts - Error in stream: ${errorMessage}`);
        controller.enqueue(encoder.encode(`data: {"error": "${errorMessage}"}\n\n`));
        controller.close();
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    logger.debug(`app/api/chat/route.ts - Handling POST request`);

    // Parse and validate the request body
    const { messages } = await request.json();
    logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

    if (!Array.isArray(messages)) {
      logger.warn(`app/api/chat/route.ts - Invalid request format: messages is not an array.`);
      return NextResponse.json({ error: 'Invalid request format. "messages" must be an array.' }, { status: 400 });
    }

    // Construct conversation context
    let conversationContext = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
      .join('\n');

    conversationContext = `${systemPrompt}\n\n${conversationContext}\nAssistant:`;
    logger.silly(`app/api/chat/route.ts - Initialized conversation context: ${conversationContext}`);

    const responses: Array<{ persona: string, message: string }> = [];

    // Perform all persona calls in parallel
    logger.debug(`app/api/chat/route.ts - Making requests to personas: Eliza, Alice, Gemma`);
    const [elizaResult, aliceResult, gemmaResult] = await Promise.allSettled([
      generateElizaResponse([...messages]),  // Eliza's response
      generateAliceResponse([...messages]),  // Alice's response
      config.ollamaGemmaTextModel
        ? handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config) // Call to Ollama Gemma
        : Promise.resolve("Out of office. Ollama Gemma Text Model is not defined in the configuration. Please check the server configuration for model availability, such as your .env.local file.")  // Gemma's response if not configured
    ]);

    // Handle responses from each persona, updating `lastResponses` accordingly
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

    // Create and return a combined response stream with sanitized responses
    const combinedStream = await createCombinedStream(responses);

    return new NextResponse(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    logger.error(`app/api/chat/route.ts - Error: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
