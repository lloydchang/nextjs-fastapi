// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { systemPrompt } from '../../../utils/systemPrompt';
import { generateFromGoogleVertexAI } from '../../../lib/google-vertex-ai';
import { generateFromOllamaLLaMA } from '../../../lib/ollama-llama';
import { ChatbotRequestBody, ResponseSegment } from '../../../types';
import { isDefaultPlaceholder } from '../../../utils/stringUtils';
import { validateEnv } from '../../../utils/validateEnv';
// import limiter from '../../../utils/rateLimit'; // Import the rate limiter
import logger from '../../../utils/logger'; // Import the logger

/**
 * Validates environment variables at startup.
 * Ensures that all necessary configurations are present.
 */
validateEnv();

/**
 * Handler for the POST request to the /api/chat endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting: Identify the client by their IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get('x-real-ip') || request.ip || 'unknown';
    logger.info(`Client IP: ${ip}`); // For debugging

    // try {
    //   await limiter.check(ip, 10); // Allow 10 requests per minute per IP
    //   logger.info(`Rate limiting: Allowed request from IP ${ip}`);
    // } catch {
    //   logger.warn(`Rate limiting: Blocked request from IP ${ip}`);
    //   return NextResponse.json(
    //     { error: 'Too many requests. Please try again later.' },
    //     { status: 429 }
    //   );
    // }

    const { input, context } = await request.json();

    if (typeof input !== 'string') {
      logger.warn('Invalid input format: "input" must be a string.');
      return NextResponse.json(
        { error: 'Invalid input format. "input" must be a string.' },
        { status: 400 }
      );
    }

    // Sanitize user input
    const sanitizedInput = sanitizeInput(input);
    logger.info(`Sanitized input: ${sanitizedInput}`);

    // Prepare the prompt
    const prompt = context
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`
      : `${systemPrompt}\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`;

    // Prepare the request body
    const requestBody: ChatbotRequestBody = {
      model: process.env.DEFAULT_MODEL || 'google-gemini-1.5',
      prompt: prompt,
      temperature: 0.0,
    };

    // Initialize buffer and context
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
        logger.info('Attempting to generate text using Google Vertex AI (Gemini).');
        generatedText = await generateFromGoogleVertexAI(process.env.GOOGLE_GEMINI_MODEL, requestBody.prompt);
        logger.info('Text generated successfully using Google Vertex AI (Gemini).');
      } catch (vertexError) {
        logger.warn('Google Vertex AI (Gemini) API failed, falling back to local Ollama LLaMA model:', vertexError);
      }
    } else {
      logger.warn(
        'Google Vertex AI credentials or configuration not set or defaults detected. Skipping Google Vertex AI. Please update the environment variables with actual values.'
      );
    }

    // If Google Vertex AI failed or was skipped, attempt to use Ollama LLaMA
    if (!generatedText) {
      try {
        const fallbackModel = process.env.FALLBACK_MODEL || 'llama3.2';
        if (!process.env.LOCAL_LLAMA_ENDPOINT) {
          throw new Error('Local Ollama LLaMA endpoint is not configured.');
        }

        if (!fallbackModel) {
          throw new Error('Fallback model is required for Ollama LLaMA.');
        }

        logger.info(`Attempting to generate text using Ollama LLaMA model: ${fallbackModel}.`);
        generatedText = await generateFromOllamaLLaMA(
          process.env.LOCAL_LLAMA_ENDPOINT,
          requestBody.prompt,
          fallbackModel // Pass the fallbackModel as the third parameter
        );
        logger.info('Text generated successfully using Ollama LLaMA.');
      } catch (llamaError) {
        logger.error('Both Google Vertex AI (Gemini) and Ollama LLaMA models failed:', llamaError);
        return NextResponse.json(
          { error: 'Failed to generate content using both Google Vertex AI (Gemini) and Ollama LLaMA models.' },
          { status: 500 }
        );
      }
    }

    // Split the generated text into segments (sentences)
    const segments = generatedText.split(/(?<=[.!?])\s+/); // Split into sentences
    logger.info(`Generated text split into ${segments.length} segments.`);

    // Create a ReadableStream to stream data back to the client
    const stream = new ReadableStream<ResponseSegment>({
      start(controller) {
        segments.forEach((segment) => {
          const message = segment.trim();
          if (message) {
            const responseSegment: ResponseSegment = {
              message: message,
              context: currentContext,
            };
            controller.enqueue(responseSegment);
          }
        });
        controller.close();
      },
    });

    // Stream the response as JSON
    logger.info('Streaming response to the client.');
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    logger.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}

/**
 * Utility function to sanitize user input.
 * Prevents injection attacks and removes unwanted characters.
 * 
 * @param input - The raw user input.
 * @returns The sanitized input.
 */
function sanitizeInput(input: string): string {
  // Example: Remove any script tags or unwanted characters
  return input.replace(/<[^>]*>?/gm, '');
}
