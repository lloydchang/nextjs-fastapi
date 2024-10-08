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

async function createStream(persona: string, message: string) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            try {
                controller.enqueue(encoder.encode(`data: {"persona": "${persona}", "message": "${message}"}\n\n`));
                controller.close();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
                logger.error(`app/api/chat/route.ts - Error creating stream for ${persona}: ${errorMessage}`);
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
            return NextResponse.json({ error: 'Invalid request format. "messages" must be an array.' }, { status: 400 });
        }

        // Initialize the conversation context
        let conversationContext = messages
            .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
            .join('\n');

        conversationContext = `${systemPrompt}\n\n${conversationContext}\nAssistant:`;
        logger.debug(`app/api/chat/route.ts - Initialized conversation context: ${conversationContext}`);

        // Eliza's turn
        logger.debug(`app/api/chat/route.ts - Generating Eliza's response.`);
        const elizaResponse = generateElizaResponse(conversationContext, systemPrompt);
        conversationContext += `\nEliza: ${elizaResponse}`;
        logger.debug(`app/api/chat/route.ts - Eliza's response: ${elizaResponse}`);
        let elizaStream = await createStream("eliza", elizaResponse);

        // Send Eliza's response and close the stream
        const elizaResponseStream = new NextResponse(elizaStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

        // Alice's turn
        logger.debug(`app/api/chat/route.ts - Generating Alice's response.`);
        const aliceResponse = generateAliceResponse(conversationContext, systemPrompt);
        conversationContext += `\nAlice: ${aliceResponse}`;
        logger.debug(`app/api/chat/route.ts - Alice's response: ${aliceResponse}`);
        let aliceStream = await createStream("alice", aliceResponse);

        // Send Alice's response and close the stream
        const aliceResponseStream = new NextResponse(aliceStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

        // Gemma's turn based on the updated context
        logger.debug(`app/api/chat/route.ts - Generating Gemma's response.`);
        let gemmaResponse = "Gemma model is not available.";
        if (config.ollamaGemmaTextModel) {
            gemmaResponse = await handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config);
        }
        conversationContext += `\nGemma: ${gemmaResponse}`;
        logger.debug(`app/api/chat/route.ts - Gemma's response: ${gemmaResponse}`);
        let gemmaStream = await createStream("gemma", gemmaResponse);

        // Send Gemma's response and close the stream
        const gemmaResponseStream = new NextResponse(gemmaStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

        return gemmaResponseStream;  // Return the last response as the final one
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        logger.error(`app/api/chat/route.ts - Error: ${errorMessage}`);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
