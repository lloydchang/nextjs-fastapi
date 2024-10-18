// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, AppConfig } from 'app/api/chat/utils/config';
import { checkRateLimit } from 'app/api/chat/utils/rateLimiter';
import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import { UserPrompt, BotFunction } from 'types';
import logger from 'app/api/chat/utils/logger';
import { Mutex } from 'async-mutex';
import { addBotFunctions } from 'app/api/chat/controllers/BotHandlers';
import { getMessageContent } from 'app/api/chat/utils/messageUtils';

const config: AppConfig = getConfig();
const MAX_PROMPT_LENGTH = 128000;
const sessionTimeout = 60 * 60 * 1000; // 1 hour session timeout
const maxContextMessages = 100;

const clientMutexes = new Map<string, Mutex>();
const lastInteractionTimes = new Map<string, number>();
const clientContexts = new Map<string, UserPrompt[]>();

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const clientId = request.headers.get('x-client-id') || `anon-${uuidv4()}`;

  logger.silly(`Received POST request [${requestId}] from clientId: ${clientId}`);

  const { limited, retryAfter } = checkRateLimit(clientId);
  if (limited) {
    logger.warn(`Rate limit exceeded for clientId: ${clientId}, RequestId: ${requestId}`);
    return NextResponse.json({ error: 'Too Many Requests' }, {
      status: 429,
      headers: { 'Retry-After': `${retryAfter}` },
    });
  }

  let mutex = clientMutexes.get(clientId);
  if (!mutex) {
    mutex = new Mutex();
    clientMutexes.set(clientId, mutex);
    logger.silly(`Created new mutex for clientId: ${clientId}`);
  }

  return mutex.runExclusive(async () => {
    logger.silly(`Acquired mutex for clientId: ${clientId}, RequestId: ${requestId}`);
    lastInteractionTimes.set(clientId, Date.now());
    logger.silly(`Updated last interaction time for clientId: ${clientId}`);

    try {
      const body = await request.json();
      logger.debug(`Request body for RequestId: ${requestId}, clientId: ${clientId}: ${JSON.stringify(body)}`);

      const { messages } = body;
      if (!Array.isArray(messages)) {
        logger.warn(`Invalid format: messages must be an array. RequestId: ${requestId}`);
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
      }

      logger.silly(`Processing ${messages.length} messages for clientId: ${clientId}, RequestId: ${requestId}`);
      const validMessages = extractValidMessages(messages);
      logger.silly(`Filtered ${validMessages.length} valid messages for clientId: ${clientId}`);

      if (validMessages.length === 0) {
        logger.silly(`No valid messages provided by clientId: ${clientId}, RequestId: ${requestId}`);
        return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 });
      }

      let context = clientContexts.get(clientId) || [];
      logger.silly(`Previous context size for clientId: ${clientId}: ${context.length}`);

      context = [...validMessages.reverse(), ...context].slice(-maxContextMessages);
      clientContexts.set(clientId, context);
      logger.silly(`Updated context size for clientId: ${clientId}: ${context.length}`);

      const botFunctions: BotFunction[] = [];
      addBotFunctions(botFunctions, config);
      logger.silly(`Added ${botFunctions.length} bot functions for processing clientId: ${clientId}, RequestId: ${requestId}`);

      const botResponses = await executeBotFunctions(botFunctions, context);

      // Create a readable stream from the bot responses
      const stream = new ReadableStream({
        start(controller) {
          logger.silly(`Starting to stream data for clientId: ${clientId}, RequestId: ${requestId}`);
          botResponses.forEach((response) => {
            logger.silly(`Enqueuing response data for clientId: ${clientId}, RequestId: ${requestId}: ${response}`);
            controller.enqueue(new TextEncoder().encode(response));
          });
          controller.close();
          logger.silly(`Stream closed for clientId: ${clientId}, RequestId: ${requestId}`);
        },
      });

      logger.silly(`Stream prepared for clientId: ${clientId}, RequestId: ${requestId}`);
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logger.error(`Error handling POST request for clientId: ${clientId}, RequestId: ${requestId}: ${errorMessage}`);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
      logger.silly(`Released mutex for clientId: ${clientId}, RequestId: ${requestId}`);
    }
  });
}

async function executeBotFunctions(
  botFunctions: BotFunction[],
  context: UserPrompt[]
): Promise<string[]> {
  const responses: string[] = [];

  logger.silly(`Executing ${botFunctions.length} bot functions with current context size: ${context.length}`);
  for (const bot of botFunctions) {
    try {
      logger.silly(`Executing bot function for persona: ${bot.persona}`);
      const botResponse = await bot.generate(context);
      if (botResponse) {
        const message = getMessageContent(botResponse);
        responses.push(`data: ${JSON.stringify({ persona: bot.persona, message })}\n\n`);
        logger.silly(`Stream data sent for bot ${bot.persona}: ${message}`);
        context.push({ role: 'bot', content: message, persona: bot.persona });
        logger.silly(`Added bot response to context. New context size: ${context.length}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logger.error(`Error processing bot ${bot.persona}: ${errorMessage}`);
      responses.push(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      logger.silly(`Error response sent for bot ${bot.persona}: ${errorMessage}`);
    }
  }

  if (responses.length === 0) {
    responses.push('data: [DONE]\n\n');
    logger.silly(`No responses generated. Sending [DONE] signal.`);
  }

  return responses;
}
