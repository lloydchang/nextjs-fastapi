// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { generateElizaResponse } from './utils/eliza';
import { generateAliceResponse } from './utils/alice';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/logger';
import path from 'path';
import fs from 'fs'; // Import file system module to write to a file

const config = getConfig();

// Store the last response for each persona
const lastResponses: { [key: string]: string } = {};

// Log directory path
const logDirPath = path.resolve(process.cwd(), 'logs');

// Ensure the log directory exists
if (!fs.existsSync(logDirPath)) {
  fs.mkdirSync(logDirPath, { recursive: true });
}

// Log file path for backend interactions
const logFilePath = path.join(logDirPath, 'chat_interactions.log');

async function createCombinedStream(messages: Array<{ persona: string, message: string }>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for (const { persona, message } of messages) {
          logger.debug(`app/api/chat/route.ts - Streaming message from ${persona}: ${message}`);
          controller.enqueue(encoder.encode(`data: {"persona": "${persona}", "message": "${message}"}\n\n`));
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

    // Save the incoming request to a log file
    fs.appendFileSync(logFilePath, `\n[${new Date().toISOString()}] Incoming Request: ${JSON.stringify(messages)}\n`);

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
        ? handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config)
        : Promise.resolve("Out of office. Ollama Gemma Text Model is not defined in the configuration.")
    ]);

    // Handle Eliza's response
    if (elizaResult.status === 'fulfilled') {
      const newResponse = elizaResult.value;
      logger.debug(`app/api/chat/route.ts - Eliza response: ${newResponse}`);
      if (newResponse !== lastResponses['Eliza']) {
        responses.push({ persona: 'Eliza', message: newResponse });
        lastResponses['Eliza'] = newResponse;
      } else {
        logger.debug(`app/api/chat/route.ts - Skipping repeated response for Eliza.`);
      }
    } else {
      const elizaError = `Eliza is unavailable: ${elizaResult.reason}`;
      logger.error(`app/api/chat/route.ts - ${elizaError}`);
      responses.push({ persona: 'Eliza', message: elizaError });
    }

    // Handle Alice's response
    if (aliceResult.status === 'fulfilled') {
      const newResponse = aliceResult.value;
      logger.debug(`app/api/chat/route.ts - Alice response: ${newResponse}`);
      if (newResponse !== lastResponses['Alice']) {
        responses.push({ persona: 'Alice', message: newResponse });
        lastResponses['Alice'] = newResponse;
      } else {
        logger.debug(`app/api/chat/route.ts - Skipping repeated response for Alice.`);
      }
    } else {
      const aliceError = `Alice is unavailable: ${aliceResult.reason}`;
      logger.error(`app/api/chat/route.ts - ${aliceError}`);
      responses.push({ persona: 'Alice', message: aliceError });
    }

    // Handle Gemma's response
    if (gemmaResult.status === 'fulfilled') {
      const newResponse = gemmaResult.value;
      logger.debug(`app/api/chat/route.ts - Gemma raw response: ${JSON.stringify(newResponse)}`);
      if (newResponse !== lastResponses['Gemma']) {
        responses.push({ persona: 'Gemma', message: newResponse });
        lastResponses['Gemma'] = newResponse;
      } else {
        logger.debug(`app/api/chat/route.ts - Skipping repeated response for Gemma.`);
      }
    } else {
      const gemmaError = `Gemma is unavailable: ${gemmaResult.reason}`;
      logger.error(`app/api/chat/route.ts - ${gemmaError}`);
      responses.push({ persona: 'Gemma', message: gemmaError });
    }

    // Log the responses to a file
    fs.appendFileSync(logFilePath, `\n[${new Date().toISOString()}] Responses: ${JSON.stringify(responses)}\n`);

    // Create and return a combined response stream
    logger.debug(`app/api/chat/route.ts - Creating combined response stream with responses: ${JSON.stringify(responses)}`);
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
    fs.appendFileSync(logFilePath, `\n[${new Date().toISOString()}] Error: ${errorMessage}\n`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
