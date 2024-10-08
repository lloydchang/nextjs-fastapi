// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/logger';

const config = getConfig();

export async function POST(request: NextRequest) {
    try {
        logger.debug(`app/api/chat/route.ts - Handling POST request`);

        const { messages } = await request.json();
        logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(messages)}`);

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid request format. "messages" must be an array.' }, { status: 400 });
        }

        const sanitizedMessages = messages
            .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${sanitizeInput(msg.content)}`)
            .join('\n');

        const prompt = `${systemPrompt}\n\n${sanitizedMessages}\nAssistant:`;

        if (!prompt.trim()) {
            return NextResponse.json({ error: 'The constructed prompt is empty.' }, { status: 400 });
        }

        logger.debug(`app/api/chat/route.ts - Constructed prompt: ${prompt}`);

        if (!config.ollamaGemmaTextModel) {
            logger.error("app/api/chat/route.ts - Ollama Gemma Text Model is not defined in the configuration.");
            const errorResponse = { error: 'Ollama Gemma Text Model is not defined in the configuration.', details: 'Please check the server configuration for model availability, such as your .env.local file.' };
            logger.debug(`app/api/chat/route.ts - Sending response: ${JSON.stringify(errorResponse)}`);
            return NextResponse.json(errorResponse, { status: 500 });
        }

        const results = await Promise.allSettled([
            handleTextWithOllamaGemmaTextModel({ userPrompt: prompt, textModel: config.ollamaGemmaTextModel }, config),
        ]);

        const responses = results
            .filter((res) => res.status === 'fulfilled')
            .map((res: any) => res.value);

        if (responses.length > 0) {
            return NextResponse.json({ message: responses.join('\n') });
        } else {
            const errorResponse = { error: 'No valid responses from any model.', details: 'The models returned empty results.' };
            logger.debug(`app/api/chat/route.ts - Sending response: ${JSON.stringify(errorResponse)}`);
            return NextResponse.json(errorResponse, { status: 500 });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        const errorDetails = error instanceof Error ? error.stack || 'No stack trace available' : 'Unknown error occurred.';
        logger.error(`app/api/chat/route.ts - Error: ${errorMessage}`);
        
        const errorResponse = {
            error: errorMessage,
            details: errorDetails,
        };
        logger.debug(`app/api/chat/route.ts - Sending response: ${JSON.stringify(errorResponse)}`);
        return NextResponse.json(errorResponse, { status: 500 });
    }
}
