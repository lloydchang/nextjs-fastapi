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

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                logger.debug(`app/api/chat/route.ts - Handling POST request`);

                const { messages } = await request.json();
                logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

                if (!Array.isArray(messages)) {
                    controller.enqueue(encoder.encode('data: {"error": "Invalid request format. \\"messages\\" must be an array."}\n\n'));
                    controller.close();
                    return;
                }

                // Initialize the conversation context
                let conversationContext = messages
                    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
                    .join('\n');

                conversationContext = `${systemPrompt}\n\n${conversationContext}\nAssistant:`;

                // Infinite conversation loop
                while (true) {
                    // Eliza's turn
                    const elizaResponse = generateElizaResponse(conversationContext, systemPrompt);
                    conversationContext += `\nEliza: ${elizaResponse}`;
                    controller.enqueue(encoder.encode(`data: {"persona": "eliza", "message": "${elizaResponse}"}\n\n`));
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    // Alice's turn
                    const aliceResponse = generateAliceResponse(conversationContext, systemPrompt);
                    conversationContext += `\nAlice: ${aliceResponse}`;
                    controller.enqueue(encoder.encode(`data: {"persona": "alice", "message": "${aliceResponse}"}\n\n`));
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    // Gemma's turn based on the updated context
                    let gemmaResponse = "Gemma model is not available.";
                    if (config.ollamaGemmaTextModel) {
                        gemmaResponse = await handleTextWithOllamaGemmaTextModel({ userPrompt: conversationContext, textModel: config.ollamaGemmaTextModel }, config);
                    }
                    conversationContext += `\nGemma: ${gemmaResponse}`;
                    controller.enqueue(encoder.encode(`data: {"persona": "gemma", "message": "${gemmaResponse}"}\n\n`));
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
                logger.error(`app/api/chat/route.ts - Error: ${errorMessage}`);
                controller.enqueue(encoder.encode(`data: {"error": "${errorMessage}"}\n\n`));
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
}
