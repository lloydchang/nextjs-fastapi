// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { systemPrompt } from '../../../utils/systemPrompt';
import { generateFromGoogleVertexAI } from '../../../lib/google-vertex-ai';
import { generateFromOllamaLLaMA } from '../../../lib/ollama-llama';
import { ChatbotRequestBody, ResponseSegment } from '../../../types';
import { isDefaultPlaceholder } from '../../../utils/stringUtils';
import { validateEnv } from '../../../utils/validateEnv';
import limiter from '../../../utils/rateLimit';
import logger from '../../../utils/logger';

validateEnv();

export async function POST(request: NextRequest) {
  const logMessages: string[] = []; // Array to capture log messages for response

  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get('x-real-ip') || request.ip || 'unknown';
    logMessages.push(`Client IP: ${ip}`);

    // Rate Limiting Check
    try {
      await limiter.check(ip, 100); // Allow 100 requests per minute per IP for development
      logMessages.push(`Rate limiting: Allowed request from IP ${ip}`);
    } catch {
      logMessages.push(`Rate limiting: Blocked request from IP ${ip}`);
      return streamErrorMessage('Too many requests. Please try again later.', logMessages);
    }

    // Extract input and context from the request body
    const { input, context } = await request.json();

    if (typeof input !== 'string') {
      logMessages.push('Invalid input format: "input" must be a string.');
      return streamErrorMessage('Invalid input format. "input" must be a string.', logMessages);
    }

    // Sanitize user input
    const sanitizedInput = sanitizeInput(input);
    logMessages.push(`Sanitized input: ${sanitizedInput}`);

    // Prepare the prompt
    const prompt = context
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`
      : `${systemPrompt}\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`;

    const requestBody: ChatbotRequestBody = {
      model: process.env.DEFAULT_MODEL || 'google-gemini-1.5',
      prompt: prompt,
      temperature: 0.0,
    };

    let currentContext: string | null = context || null;
    let generatedText: string = '';

    // Attempt to use Google Vertex AI (Gemini)
    if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      process.env.GOOGLE_GEMINI_MODEL &&
      process.env.GOOGLE_VERTEX_AI_LOCATION &&
      !isDefaultPlaceholder(process.env.GOOGLE_APPLICATION_CREDENTIALS) &&
      !isDefaultPlaceholder(process.env.GOOGLE_CLOUD_PROJECT)
    ) {
      try {
        generatedText = await generateFromGoogleVertexAI(process.env.GOOGLE_GEMINI_MODEL, requestBody.prompt);
        logMessages.push('Text generated successfully using Google Vertex AI (Gemini).');
      } catch (vertexError) {
        logMessages.push(`Google Vertex AI failed: ${vertexError.message}`);
      }
    }

    // If Google Vertex AI failed or was skipped, attempt to use Ollama LLaMA
    if (!generatedText) {
      try {
        const fallbackModel = process.env.FALLBACK_MODEL || 'llama3.2';
        if (!process.env.LOCAL_LLAMA_ENDPOINT) throw new Error('Local Ollama LLaMA endpoint is not configured.');

        generatedText = await generateFromOllamaLLaMA(process.env.LOCAL_LLAMA_ENDPOINT, requestBody.prompt, fallbackModel);
        logMessages.push('Text generated successfully using Ollama LLaMA.');
      } catch (llamaError) {
        logMessages.push(`Ollama LLaMA failed: ${llamaError.message}`);
        return streamErrorMessage(`Both models failed: ${llamaError.message}`, logMessages);
      }
    }

    const segments = generatedText.split(/(?<=[.!?])\s+/);

    // Create a ReadableStream to send data back to the client
    const stream = new ReadableStream({
      start(controller) {
        // First, send any collected log messages as JSON strings
        logMessages.forEach((log) => {
          const responseSegment: ResponseSegment = { message: `[Log]: ${log}`, context: currentContext };
          controller.enqueue(JSON.stringify(responseSegment) + '\n'); // Stringify and add newline
        });

        // Send each text segment as a new message
        segments.forEach((segment) => {
          const message = segment.trim();
          if (message) {
            const responseSegment: ResponseSegment = { message: message, context: currentContext };
            controller.enqueue(JSON.stringify(responseSegment) + '\n'); // Stringify and add newline
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
  } catch (error) {
    logMessages.push(`Internal Server Error: ${error.message}`);
    return streamErrorMessage('Internal Server Error', logMessages);
  }
}

/**
 * Stream error message along with logs to the frontend.
 */
function streamErrorMessage(error: string, logs: string[]) {
  const stream = new ReadableStream({
    start(controller) {
      const errorSegment: ResponseSegment = { message: `Error: ${error}`, context: null };
      controller.enqueue(JSON.stringify(errorSegment) + '\n'); // Stringify and add newline

      logs.forEach((log) => {
        const logSegment: ResponseSegment = { message: `[Log]: ${log}`, context: null };
        controller.enqueue(JSON.stringify(logSegment) + '\n'); // Stringify and add newline
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

function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>?/gm, '');
}
