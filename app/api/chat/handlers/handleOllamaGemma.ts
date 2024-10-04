// File: app/api/chat/handlers/handleOllamaGemma.ts

import { NextRequest, NextResponse } from 'next/server';
import { makeRequest } from '../utils/request';
import { streamResponseBody } from '../utils/stream';
import logger from '../utils/log';

let hasWarnedOllamaGemma = false;

/**
 * Handler for processing requests using Ollama Gemma model.
 */
export async function handleTextWithOllamaGemmaModel(req: NextRequest): Promise<NextResponse> {
  const { OLLAMA_GEMMA_ENDPOINT, OLLAMA_GEMMA_MODEL } = process.env;

  if (!OLLAMA_GEMMA_ENDPOINT || !OLLAMA_GEMMA_MODEL) {
    if (!hasWarnedOllamaGemma) {
      logger.debug(
        'Ollama Gemma: Optional environment variables are missing or contain your- placeholders: OLLAMA_GEMMA_ENDPOINT, OLLAMA_GEMMA_MODEL'
      );
      hasWarnedOllamaGemma = true;
    }
    return NextResponse.json(
      { error: 'Ollama Gemma: Optional environment variables are missing.' },
      { status: 500 }
    );
  }

  // Read the request body as JSON
  const body = await req.json();
  if (!body || !body.prompt) {
    logger.warn('Ollama Gemma: Request body is missing the required property: prompt');
    return NextResponse.json(
      { error: 'Ollama Gemma: Request body must contain a prompt.' },
      { status: 400 }
    );
  }

  try {
    const payload = { model: OLLAMA_GEMMA_MODEL, prompt: body.prompt };
    logger.info(`Ollama Gemma: Sending request with prompt: ${payload.prompt}`);

    const responseStream = await makeRequest(OLLAMA_GEMMA_ENDPOINT, payload);
    const generatedText = await streamResponseBody(responseStream);

    logger.info(`Ollama Gemma: Generated text: ${generatedText}`);
    return NextResponse.json({ response: generatedText }, { status: 200 });
  } catch (error) {
    logger.warn(`Ollama Gemma: Service Error: ${error.message}`);
    return NextResponse.json(
      { error: `Ollama Gemma: Failed to generate text: ${error.message}` },
      { status: 500 }
    );
  }
}
