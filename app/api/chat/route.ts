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

async function createCombinedStream(messages: Array<{ persona: string, message: string }>) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            try {
                for (const { persona, message } of messages) {
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

        // Construct conversation context
        let conversationContext = messages
            .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
            .join('\n');

        conversationContext = `${systemPrompt}\n\n${conversationContext}\nAssistant:`;
        logger.debug(`app/api/chat/route.ts - Initialized conversation context: ${conversationContext}`);

        const responses: Array<{ persona: string, message: string }> = [];

        // Perform all persona calls in parallel
        const [elizaResult, aliceResult, gemmaResult] = await Promise.allSettled([
            generateElizaResponse([...messages]),  // Eliza's response
            generateAliceResponse([...messages]),  // Alice's response
            config.ollamaGemmaTextModel
                ? handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config)
                : Promise.resolve("Out of office.")  // Gemma's response if not configured
        ]);

        // Handle Eliza's response
        if (elizaResult.status === 'fulfilled') {
            responses.push({ persona: 'Eliza', message: elizaResult.value });
            conversationContext += `\nEliza: ${elizaResult.value}`;
        } else {
            const elizaError = `Eliza is unavailable: ${elizaResult.reason}`;
            logger.error(`app/api/chat/route.ts - ${elizaError}`);
            responses.push({ persona: 'Eliza', message: elizaError });
        }

        // Handle Alice's response
        if (aliceResult.status === 'fulfilled') {
            responses.push({ persona: 'Alice', message: aliceResult.value });
            conversationContext += `\nAlice: ${aliceResult.value}`;
        } else {
            const aliceError = `Alice is unavailable: ${aliceResult.reason}`;
            logger.error(`app/api/chat/route.ts - ${aliceError}`);
            responses.push({ persona: 'Alice', message: aliceError });
        }

        // Handle Gemma's response
        if (gemmaResult.status === 'fulfilled') {
            responses.push({ persona: 'Gemma', message: gemmaResult.value });
        } else {
            const gemmaError = `Gemma is unavailable: ${gemmaResult.reason}`;
            logger.error(`app/api/chat/route.ts - ${gemmaError}`);
            responses.push({ persona: 'Gemma', message: gemmaError });
        }

        // Create and return a combined response stream
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
