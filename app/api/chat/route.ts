// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { systemPrompt } from '../../../utils/systemPrompt';
import { generateFromGoogleVertexAI } from '../../../lib/google-vertex-ai';
import { generateFromOllamaLLaMA } from '../../../lib/ollama-llama';
import { ChatbotRequestBody, ResponseSegment } from '../../../types';
import { isDefaultPlaceholder } from '../../../utils/stringUtils';
import { validateEnv } from '../../../utils/validateEnv';
import { checkRateLimit } from '../../../utils/rateLimit';
import { getConfig } from '../../../utils/config'; // Import configuration utility
import logger from '../../../utils/logger';

validateEnv(); // Ensure environment variables are validated before use

// Retrieve configuration values using the config utility
const config = getConfig();

export async function POST(request: NextRequest) {
  const logMessages: string[] = [];
  let generatedText = '';

  try {
    // Determine client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get('x-real-ip') || request.ip || 'unknown';
    logMessages.push(`Client IP: ${ip}`);

    // Rate limiting check if enabled
    if (config.rateLimitEnabled) {
      try {
        await checkRateLimit(ip, 100); // Allow 100 requests per minute per IP
        logMessages.push(`Rate limiting: Allowed request from IP ${ip}`);
      } catch {
        logMessages.push(`Rate limiting: Blocked request from IP ${ip}`);
        return streamErrorMessage('Too many requests. Please try again later.', logMessages);
      }
    } else {
      logMessages.push('Rate limiting is disabled.');
    }

    // Parse request body
    const { input, context } = await request.json();
    if (typeof input !== 'string') {
      logMessages.push('Invalid input format: "input" must be a string.');
      return streamErrorMessage('Invalid input format. "input" must be a string.', logMessages);
    }

    const sanitizedInput = sanitizeInput(input);
    logMessages.push(`Sanitized input: ${sanitizedInput}`);

    // Prepare the prompt with optional context
    const prompt = context
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`
      : `${systemPrompt}\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`;

    const requestBody: ChatbotRequestBody = {
      model: config.primaryModel, // Use configured primary model
      prompt: prompt,
      temperature: config.temperature, // Use temperature from config
    };

    // Attempt to generate text using the primary model
    try {
      generatedText = await generateTextWithPrimaryModel(requestBody, logMessages);
    } catch (primaryError) {
      logMessages.push(`Primary model failed: ${primaryError.message}`);

      // Fallback to secondary model if primary model fails
      if (config.fallbackModel && config.llamaEndpoint) {
        try {
          generatedText = await generateTextWithFallbackModel(requestBody.prompt, logMessages);
        } catch (fallbackError) {
          logMessages.push(`Fallback model failed: ${fallbackError.message}`);
          
          // Handle unexpected response format specifically
          if (fallbackError.message.includes('Unexpected response format')) {
            return handleUnexpectedResponseFormatError(logMessages, context);
          }
          
          return streamErrorMessage(`Both models failed: ${fallbackError.message}`, logMessages);
        }
      } else {
        return streamErrorMessage('Both models failed and no fallback is configured.', logMessages);
      }
    }

    return config.streamEnabled
      ? streamResponseWithLogs(generatedText, logMessages, context)
      : sendCompleteResponse(generatedText, logMessages, context);
  } catch (error) {
    logMessages.push(`Internal Server Error: ${error.message}`);
    return streamErrorMessage('Internal Server Error', logMessages);
  }
}

/**
 * Handle cases where the response format is unexpected.
 */
function handleUnexpectedResponseFormatError(logs: string[], context: string | null) {
  logs.push('Error: Unexpected response format encountered. The response did not match the expected structure.');

  // Provide a meaningful error response with logs included
  return sendCompleteResponse('Unexpected response format encountered. Please verify the model output.', logs, context);
}

/**
 * Generate text using the primary model.
 */
async function generateTextWithPrimaryModel(requestBody: ChatbotRequestBody, logs: string[]) {
  const { googleCredentials, googleModel, googleProject, googleLocation } = config;

  if (
    googleCredentials &&
    googleModel &&
    googleLocation &&
    !isDefaultPlaceholder(googleCredentials) &&
    !isDefaultPlaceholder(googleProject)
  ) {
    try {
      const generatedText = await generateFromGoogleVertexAI(googleModel, requestBody.prompt);
      logs.push('Text generated successfully using Google Vertex AI.');
      return generatedText;
    } catch (vertexError) {
      throw new Error(`Google Vertex AI failed: ${vertexError.message}`);
    }
  }
  throw new Error('Google Vertex AI configuration is missing or incomplete.');
}

/**
 * Generate text using the fallback model.
 */
async function generateTextWithFallbackModel(prompt: string, logs: string[]) {
  if (!config.fallbackModel || !config.llamaEndpoint) {
    throw new Error('Fallback model or endpoint not configured.');
  }

  try {
    const generatedText = await generateFromOllamaLLaMA(config.llamaEndpoint, prompt, config.fallbackModel);
    logs.push('Text generated successfully using Ollama LLaMA.');
    return generatedText;
  } catch (llamaError) {
    if (llamaError.message.includes('fetch failed')) {
      throw new Error('Ollama LLaMA server is unreachable or misconfigured.');
    }
    throw new Error(`Ollama LLaMA failed: ${llamaError.message}`);
  }
}

/**
 * Stream response with logs if enabled.
 */
function streamResponseWithLogs(text: string, logs: string[], context: string | null) {
  const segments = text.split(/(?<=[.!?])\s+/);

  const stream = new ReadableStream<ResponseSegment>({
    start(controller) {
      if (config.logsInResponse) {
        logs.forEach((log) => {
          const responseSegment: ResponseSegment = { message: `[Log]: ${log}`, context: context };
          controller.enqueue(JSON.stringify(responseSegment) + '\n');
        });
      }

      segments.forEach((segment) => {
        const message = segment.trim();
        if (message) {
          const responseSegment: ResponseSegment = { message: message, context: context };
          controller.enqueue(JSON.stringify(responseSegment) + '\n');
        }
      });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Send a complete response with logs if enabled.
 */
function sendCompleteResponse(text: string, logs: string[], context: string | null) {
  const segments = text.split(/(?<=[.!?])\s+/);

  const responseSegments: ResponseSegment[] = [];

  if (config.logsInResponse) {
    logs.forEach((log) => {
      responseSegments.push({ message: `[Log]: ${log}`, context: context });
    });
  }

  segments.forEach((segment) => {
    const message = segment.trim();
    if (message) {
      responseSegments.push({ message: message, context: context });
    }
  });

  return new NextResponse(JSON.stringify(responseSegments), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Stream error message along with logs if enabled.
 */
function streamErrorMessage(error: string, logs: string[]) {
  const stream = new ReadableStream<ResponseSegment>({
    start(controller) {
      const errorSegment: ResponseSegment = { message: `Error: ${error}`, context: null };
      controller.enqueue(JSON.stringify(errorSegment) + '\n');

      if (config.logsInResponse) {
        logs.forEach((log) => {
          const logSegment: ResponseSegment = { message: `[Log]: ${log}`, context: null };
          controller.enqueue(JSON.stringify(logSegment) + '\n');
        });
      }

      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Sanitize input to prevent unwanted characters.
 */
function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>?/gm, '');
}
