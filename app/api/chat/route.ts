// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { systemPrompt } from '../../../utils/systemPrompt';

// Define the structure of the request body
type ChatbotRequestBody = {
  model: string;
  prompt: string;
  temperature: number;
};

// Environment variables
const {
  GOOGLE_GEMINI_ENDPOINT,
  GOOGLE_GEMINI_API_KEY,
  LOCAL_LLAMA_ENDPOINT,
  DEFAULT_MODEL,
  FALLBACK_MODEL,
} = process.env;

// Utility function to send POST requests to chatbot endpoints
const sendToEndpoint = async (
  endpoint: string,
  requestBody: ChatbotRequestBody,
  apiKey?: string
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // If an API key is provided, include it in the headers (adjust header name as needed)
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to access the response body stream.');

  return reader;
};

// Handler for the API route
export async function POST(request: NextRequest) {
  try {
    const { input, context } = await request.json();

    if (typeof input !== 'string') {
      return NextResponse.json({ error: 'Invalid input format. "input" must be a string.' }, { status: 400 });
    }

    // Prepare the initial request body
    const requestBody: ChatbotRequestBody = {
      model: DEFAULT_MODEL || 'google-gemini-1.5',
      prompt: context
        ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${input}\nAssistant:`
        : `${systemPrompt}\n### New Input:\nUser: ${input}\nAssistant:`,
      temperature: 0.0,
    };

    const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;
    let reader: ReadableStreamDefaultReader<Uint8Array>;
    let buffer = ''; // Buffer to accumulate complete segments
    let currentContext: string | null = context || null;

    // Attempt to connect to Google Gemini first
    try {
      if (!GOOGLE_GEMINI_ENDPOINT || !GOOGLE_GEMINI_API_KEY) {
        throw new Error('Google Gemini endpoint or API key is not configured.');
      }
      reader = await sendToEndpoint(GOOGLE_GEMINI_ENDPOINT, requestBody, GOOGLE_GEMINI_API_KEY);
    } catch (remoteError) {
      console.warn('Google Gemini API failed, falling back to local LLaMA model:', remoteError);

      // Modify the request body for local LLaMA
      requestBody.model = FALLBACK_MODEL || 'llama3.2';

      // Attempt to connect to local LLaMA model
      try {
        if (!LOCAL_LLAMA_ENDPOINT) {
          throw new Error('Local LLaMA endpoint is not configured.');
        }
        reader = await sendToEndpoint(LOCAL_LLAMA_ENDPOINT, requestBody);
      } catch (localError) {
        console.error('Both remote and local chatbot services failed:', localError);
        return NextResponse.json(
          { error: 'Failed to connect to chatbot services.' },
          { status: 500 }
        );
      }
    }

    // Create a ReadableStream to stream data back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          const chunk = value ? decoder.decode(value, { stream: true }) : '';

          if (chunk) {
            try {
              const parsed = JSON.parse(chunk);
              if (parsed.response) {
                buffer += parsed.response;

                // Check if buffer has a complete segment
                if (sentenceEndRegex.test(buffer)) {
                  const completeSegment = buffer.trim();
                  buffer = ''; // Clear buffer for next segment

                  // Update context if provided
                  if (parsed.context) {
                    currentContext = parsed.context;
                  }

                  // Create a JSON object for the segment
                  const segment = {
                    message: completeSegment,
                    context: currentContext,
                  };

                  // Encode the segment and enqueue it
                  controller.enqueue(new TextEncoder().encode(JSON.stringify(segment) + '\n'));
                }
              }
              done = parsed.done || streamDone;
            } catch (e) {
              console.error('Error parsing chunk:', chunk, e);
            }
          } else {
            done = true;
          }
        }

        // Ensure remaining buffer (if any) is sent to the client
        if (buffer.length > 0) {
          const finalSegment = {
            message: buffer.trim(),
            context: currentContext,
          };
          controller.enqueue(new TextEncoder().encode(JSON.stringify(finalSegment) + '\n'));
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
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}
