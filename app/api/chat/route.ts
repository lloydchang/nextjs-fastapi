// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import { sanitizeInput } from './utils/sanitize';
import { systemPrompt } from './utils/prompt';
import logger from './utils/logger';
import { validateEnvVars } from './utils/validate';

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

    const results = await Promise.allSettled([
      handleTextWithOllamaGemmaTextModel({ userPrompt: prompt, textModel: config.ollamaGemmaTextModel }, config),
      // Add more handlers as needed...
    ]);

    const responses = results
      .filter((res) => res.status === 'fulfilled')
      .map((res: any) => res.value);

    if (responses.length > 0) {
      return NextResponse.json({ message: responses.join('\n') });
    } else {
      return NextResponse.json({ error: 'No valid responses from any model.' }, { status: 500 });
    }
  } catch (error) {
    logger.error(`app/api/chat/route.ts - Error: ${error.message}`);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
