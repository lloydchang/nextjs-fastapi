// File: app/api/chat/test-route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateFromOllamaGemma } from './clients/OllamaGemmaClient';
import { getConfig } from './utils/config';
import { logger } from './utils/logger';

/**
 * Test route to verify Ollama Gemma integration.
 * Send a POST request to /api/chat/test-route with a JSON body if needed.
 * Otherwise, it uses a predefined user prompt.
 * @param request - Incoming HTTP request.
 * @returns {Promise<NextResponse>} - JSON response with the generated message or error.
 */
export async function POST(request: NextRequest) {
  const config = getConfig();

  const systemPrompt = config.systemPrompt;
  const userPrompt = "What is the capital of Germany?";

  const structuredPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

  try {
    const response = await generateFromOllamaGemma({
      endpoint: config.ollamaGemmaEndpoint,
      userPrompt: structuredPrompt,
      model: config.ollamaGemmaTextModel,
    });

    if (response) {
      return NextResponse.json({ message: response }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to generate text from Ollama Gemma.' }, { status: 500 });
    }
  } catch (error) {
    logger.error(`test-route.ts - Error: ${error}`);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
