// File: app/api/chat/controllers/GoogleVertexGeminiController.ts

import { NextResponse } from 'next/server';
import logger from '../utils/logger';
import { getConfig } from '../utils/config';

export async function handleTextWithGoogleVertexGeminiTextModel(
  { userPrompt, textModel }: { userPrompt: string; textModel: string },
  config: any
): Promise<string> {
  // Get the configuration data and log its structure for inspection
  const configData = getConfig();
  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Loaded config: ${JSON.stringify(configData)}`);

  // Destructure the Google Vertex Gemini endpoint from the configData object
  const { googleVertexGeminiEndpoint } = configData;

  // Debugging logs for endpoint and inputs
  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - GOOGLE_VERTEX_GEMINI_ENDPOINT: ${googleVertexGeminiEndpoint}`);
  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Text model provided: ${textModel}`);
  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - ${userPrompt}`);

  // Check if required environment variables are set
  if (!googleVertexGeminiEndpoint || !textModel) {
    logger.error('app/api/chat/controllers/GoogleVertexGeminiController.ts - Missing required environment variables:');
    if (!googleVertexGeminiEndpoint) {
      logger.error('Google Vertex Gemini endpoint is missing.');
    }
    if (!textModel) {
      logger.error('Text model is missing.');
    }
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }

  const payload = { textModel, userPrompt };
  logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Sending payload: ${JSON.stringify(payload)}`);

  try {
    // Sending request to the Google Vertex Gemini endpoint
    const response = await fetch(googleVertexGeminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Check for HTTP errors
    if (!response.ok) {
      logger.error(`app/api/chat/controllers/GoogleVertexGeminiController.ts - HTTP error! status: ${response.status}`);
      return ''; // Return an empty string or a suitable fallback instead of throwing an error
    }

    const reader = response.body?.getReader();
    if (!reader) {
      logger.error('app/api/chat/controllers/GoogleVertexGeminiController.ts - Failed to access the response body stream.');
      return ''; // Return an empty string or a suitable fallback instead of throwing an error
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let done = false;
    const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;

    // Reading the response stream
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      const chunk = decoder.decode(value, { stream: true });

      logger.silly(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Received chunk: ${chunk}`);

      try {
        const parsed = JSON.parse(chunk);
        if (parsed.response) {
          buffer += parsed.response;

          // Check if buffer has a complete segment
          if (sentenceEndRegex.test(buffer)) {
            const completeSegment = buffer.trim();
            buffer = ''; // Clear buffer for next segment

            logger.verbose(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Incoming segment: ${completeSegment}`);
          }
        }
        done = parsed.done || streamDone;
      } catch (e) {
        logger.error(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Error parsing chunk: ${chunk}, Error: ${e}`);
      }
    }

    // Return final buffer if there's remaining text
    logger.verbose(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Final response: ${buffer.trim()}`);
    return buffer.trim();
  } catch (error) {
    logger.error(`app/api/chat/controllers/GoogleVertexGeminiController.ts - Error during fetch: ${error}`);
    return ''; // Return an empty string or a suitable fallback instead of throwing an error
  }
}
