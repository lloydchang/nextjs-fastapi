// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { systemPrompt } from '../../../utils/systemPrompt';
import { generateFromGoogleVertexAI } from '../../../lib/google-vertex-ai';
import { generateFromOllamaLLaMA } from '../../../lib/ollama-llama';
import { ChatbotRequestBody, ResponseSegment } from '../../../types';

/**
 * Handler for the POST request to the /api/chat endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const { input, context } = await request.json();

    if (typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format. "input" must be a string.' },
        { status: 400 }
      );
    }

    // Prepare the prompt
    const prompt = context
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${input}\nAssistant:`
      : `${systemPrompt}\n### New Input:\nUser: ${input}\nAssistant:`;

    // Prepare the request body
    const requestBody: ChatbotRequestBody = {
      model: process.env.DEFAULT_MODEL || 'google-gemini-1.5',
      prompt: prompt,
      temperature: 0.0,
    };

    // Regular expression to detect sentence endings
    const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;

    // Initialize buffer and context
    let buffer = '';
    let currentContext: string | null = context || null;

    let generatedText: string = '';

    // Attempt to generate content using Google Vertex AI (Gemini)
    try {
      if (!process.env.GOOGLE_GEMINI_MODEL || !process.env.GOOGLE_VERTEX_AI_LOCATION) {
        throw new Error('Google Vertex AI model or location is not configured.');
      }
      generatedText = await generateFromGoogleVertexAI(process.env.GOOGLE_GEMINI_MODEL, requestBody.prompt);
    } catch (vertexError) {
      console.warn('Google Vertex AI (Gemini) API failed, falling back to local Ollama LLaMA model:', vertexError);

      // Modify the request body for local LLaMA if necessary
      const llamaPrompt = requestBody.prompt; // Modify if your LLaMA API expects a different format

      // Attempt to generate content using Ollama LLaMA
      try {
        if (!process.env.LOCAL_LLAMA_ENDPOINT) {
          throw new Error('Local Ollama LLaMA endpoint is not configured.');
        }

        generatedText = await generateFromOllamaLLaMA(process.env.LOCAL_LLAMA_ENDPOINT, llamaPrompt);
      } catch (llamaError) {
        console.error('Both Google Vertex AI (Gemini) and Ollama LLaMA models failed:', llamaError);
        return NextResponse.json(
          { error: 'Failed to generate content using both Google Vertex AI (Gemini) and Ollama LLaMA models.' },
          { status: 500 }
        );
      }
    }

    // Split the generated text into segments (sentences)
    const segments = generatedText.split(/(?<=[.!?])\s+/); // Split into sentences

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
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}
