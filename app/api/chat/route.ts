// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from './utils/config';
import { handleTextWithOllamaGemmaTextModel } from './controllers/OllamaGemmaController';
import logger from './utils/logger';

const config = getConfig();

const queryTypeOrder: ("news" | "data" | "talk")[] = ["news", "data", "talk"]; // Maintain a round-robin order
let previousQueryType: "news" | "data" | "talk" = "news"; // Track the last used query type

// Helper function to rotate to the next query type
const getNextQueryType = (): "news" | "data" | "talk" => {
  const currentIndex = queryTypeOrder.indexOf(previousQueryType);
  const nextIndex = (currentIndex + 1) % queryTypeOrder.length;
  previousQueryType = queryTypeOrder[nextIndex];
  return previousQueryType;
};

export async function POST(request: NextRequest) {
  try {
    logger.debug(`app/api/chat/route.ts - Handling POST request`);

    // Log request headers
    const requestHeaders = Object.fromEntries(request.headers.entries());
    logger.debug(`app/api/chat/route.ts - Request Headers:`, requestHeaders);

    // Log request body
    const requestBody = await request.json();
    logger.debug(`app/api/chat/route.ts - Received messages: ${JSON.stringify(requestBody.messages)}`);

    if (!Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      logger.warn(`app/api/chat/route.ts - Invalid request format: "messages" is not an array or is empty.`);
      return NextResponse.json(
        { error: 'Invalid request format. "messages" must be a non-empty array.' },
        { status: 400 }
      );
    }

    // Extract the conversation context
    const conversationContext = requestBody.messages
      .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    logger.debug(`app/api/chat/route.ts - Conversation Context:\n${conversationContext}`);

    // Advanced LLM Prompt with context
    const llmPrompt = `
You are an intelligent agent. Based on the provided conversation context, suggest the next step:

Context:
${conversationContext}

Your goal is to guide the user through a search process. Consider rotating through search types to avoid repetition. 
Provide the next query and indicate whether it should be a "news", "data", or "talk" search. Also, suggest improvements if applicable.
`;

    logger.debug(`app/api/chat/route.ts - LLM Prompt Prepared:\n${llmPrompt}`);

    // Send the prompt to the LLM (Gemma) to determine the next action
    const llmResponse = await handleTextWithOllamaGemmaTextModel(
      { userPrompt: llmPrompt, textModel: config.ollamaGemmaTextModel },
      config
    );

    logger.debug(`app/api/chat/route.ts - Received LLM response: ${llmResponse}`);

    // Determine the next query type based on the LLM response and prevent repetition
    let nextQueryType: "news" | "data" | "talk" = "news"; // Default type

    // Keyword-based determination of the next query type
    if (/data|statistics|information/i.test(llmResponse)) {
      nextQueryType = "data";
    } else if (/talk|conversation|discussion/i.test(llmResponse)) {
      nextQueryType = "talk";
    } else if (/news|latest|updates/i.test(llmResponse)) {
      nextQueryType = "news";
    } else {
      nextQueryType = getNextQueryType(); // Rotate through types if unclear
      logger.debug(`app/api/chat/route.ts - No clear keyword match. Rotating to next query type: "${nextQueryType}"`);
    }

    // Logging the selected query type and the next query for transparency
    logger.debug(`app/api/chat/route.ts - Selected nextQueryType: "${nextQueryType}"`);
    logger.debug(`app/api/chat/route.ts - Next query suggested: "${llmResponse}"`);

    // Log the response body
    const responseBody = { nextQuery: llmResponse, queryType: nextQueryType };
    logger.debug(`app/api/chat/route.ts - Responding with:`, responseBody);

    return NextResponse.json(responseBody);
  } catch (error) {
    // Log detailed error information
    logger.error(`app/api/chat/route.ts - Error:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available',
    });

    // Optionally, log the request body if necessary
    // Be cautious about logging sensitive information

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
