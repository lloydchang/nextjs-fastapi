// app/api/chatbots/route.ts

// moved from
// pages/api/chatbot.ts
// to
// api/chatbots/route.ts
// because of Next.js 14

import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToChatbot } from '../../../services/chatService';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json(); // Only `prompt` is sent in the request body

    if (!prompt) {
      return NextResponse.json({ error: 'The "prompt" field is required.' }, { status: 400 });
    }

    // Call the chat service with the provided prompt
    const reply = await sendMessageToChatbot(prompt);

    // Return the chatbot's reply
    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return NextResponse.json({ error: 'Failed to process chatbot request.' }, { status: 500 });
  }
}

// Configuration to indicate this is an edge runtime
export const runtime = 'experimental-edge';
