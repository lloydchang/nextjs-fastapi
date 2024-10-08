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
            return NextResponse.json({ error: 'Ollama Gemma Text Model is not defined in the configuration.' }, { status: 500 });
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
            return NextResponse.json({ error: 'No valid responses from any model.', details: 'The models returned empty results.' }, { status: 500 });
        }
    } catch (error) {
        logger.error(`app/api/chat/route.ts - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Internal Server Error',
                details: error instanceof Error ? error.stack || 'No stack trace available' : 'Unknown error occurred.',
            },
            { status: 500 }
        );
    }
}
