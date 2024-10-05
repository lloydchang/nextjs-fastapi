// File: app/api/chat/handlers/handleOllamaLlama.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
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
    if (!hasWarnedOllamaLlama) {
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

  // Check request method
  if (req.method !== 'POST') {
    logger.warn(`Ollama Llama: Invalid request method: ${req.method}`);
    return NextResponse.json(
      { error: 'Ollama Llama: Invalid request method. Use POST.' },
      { status: 405 }
    );
  }

  // Check Content-Type
  const headersList = headers();
  const contentType = headersList.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn(`Ollama Llama: Invalid Content-Type: ${contentType}`);
    return NextResponse.json(
      { error: 'Ollama Llama: Invalid Content-Type. Use application/json.' },
      { status: 415 }
    );
  }

  // Read and parse the request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    logger.warn(`Ollama Llama: Failed to parse request body: ${error.message}`);
    return NextResponse.json(
      { error: 'Ollama Llama: Invalid JSON in request body.' },
      { status: 400 }
    );
  }

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