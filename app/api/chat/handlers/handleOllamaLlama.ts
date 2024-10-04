// File: app/api/chat/handlers/handleOllamaLlama.ts

import { NextRequest, NextResponse } from 'next/server';
import { makeRequest } from '../utils/request';
import { streamResponseBody } from '../utils/stream';
import logger from '../utils/log';

let hasWarnedOllamaLlama = false;

/**
 * Handler for processing requests using Ollama Llama model.
 */
export async function handleTextWithOllamaLlamaModel(req: NextRequest): Promise<NextResponse> {
  const { OLLAMA_LLAMA_ENDPOINT, OLLAMA_LLAMA_MODEL } = process.env;

  if (!OLLAMA_LLAMA_ENDPOINT || !OLLAMA_LLAMA_MODEL) {
    if (!hasWarnedOllama_Llama) {
      logger.debug(
        'Ollama Llama: Optional environment variables are missing or contain your- placeholders: OLLAMA_LLAMA_ENDPOINT, OLLAMA_LLAMA_MODEL'
      );
      hasWarnedOllamaLlama = true;
    }
    return NextResponse.json(
      { error: 'Ollama Llama: Optional environment variables are missing.' },
      { status: 500 }
    );
  }

  // Read the request body as JSON
  const body = await req.json();
  if (!body || !body.prompt) {
    logger.warn('Ollama Llama: Request body is missing the required property: prompt');
    return NextResponse.json(
      { error: 'Ollama Llama: Request body must contain a prompt.' },
      { status: 400 }
    );
  }

  try {
    const payload = { model: OLLAMA_LLAMA_MODEL, prompt: body.prompt };
    logger.info(`Ollama Llama: Sending request with prompt: ${payload.prompt}`);

    const responseStream = await makeRequest(OLLAMA_LLAMA_ENDPOINT, payload);
    const generatedText = await streamResponseBody(responseStream);

    logger.info(`Ollama Llama: Generated text: ${generatedText}`);
    return NextResponse.json({ response: generatedText }, { status: 200 });
  } catch (error) {
    logger.warn(`Ollama Llama: Service Error: ${error.message}`);
    return NextResponse.json(
      { error: `Ollama Llama: Failed to generate text: ${error.message}` },
      { status: 500 }
    );
  }
}
