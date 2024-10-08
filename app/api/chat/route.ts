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
        logger.debug(`app/api/chat/route.ts - Initialized conversation context: ${conversationContext}`);

        const responses: Array<{ persona: string, message: string }> = [];

        logger.debug(`app/api/chat/route.ts - Generating Eliza's response`);
        const elizaResponse = await generateElizaResponse([...messages]);  // Ensure this is awaited
        responses.push({ persona: 'Eliza', message: elizaResponse });
        conversationContext += `\nEliza: ${elizaResponse}`;

        logger.debug(`app/api/chat/route.ts - Generating Alice's response`);
        const aliceResponse = await generateAliceResponse([...messages]);  // Ensure this is awaited
        responses.push({ persona: 'Alice', message: aliceResponse });
        conversationContext += `\nAlice: ${aliceResponse}`;

        let gemmaResponse = "I'm unavailable.";
        if (config.ollamaGemmaTextModel) {
            gemmaResponse = await handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config);
        }
        responses.push({ persona: 'Gemma', message: gemmaResponse });

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
