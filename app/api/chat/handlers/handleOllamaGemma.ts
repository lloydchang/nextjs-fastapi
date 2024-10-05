// File: app/api/chat/handlers/handleOllamaGemma.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
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

  // Check request method
  if (req.method !== 'POST') {
    logger.warn(`Ollama Gemma: Invalid request method: ${req.method}`);
    return NextResponse.json(
      { error: 'Ollama Gemma: Invalid request method. Use POST.' },
      { status: 405 }
    );
  }

  // Check Content-Type
  const headersList = headers();
  const contentType = headersList.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn(`Ollama Gemma: Invalid Content-Type: ${contentType}`);
    return NextResponse.json(
      { error: 'Ollama Gemma: Invalid Content-Type. Use application/json.' },
      { status: 415 }
    );
  }

  // Read and parse the request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    logger.warn(`Ollama Gemma: Failed to parse request body: ${error.message}`);
    return NextResponse.json(
      { error: 'Ollama Gemma: Invalid JSON in request body.' },
      { status: 400 }
    );
  }

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
