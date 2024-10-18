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

// Ensure all imports are correct
import { getMessageContent } from 'app/api/chat/utils/messageUtils';

const config: AppConfig = getConfig();
const MAX_PROMPT_LENGTH = 128000;
const sessionTimeout = 60 * 60 * 1000; // 1 hour session timeout
const maxContextMessages = 100; // Maximum number of context messages to retain

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

      const validMessages = extractValidMessages(messages);
      logger.silly(`Filtered ${validMessages.length} valid messages for clientId: ${clientId}`);

      if (validMessages.length === 0) {
        return NextResponse.json({ error: 'No valid messages provided' }, { status: 400 });
      }

      let context = clientContexts.get(clientId) || [];
      context = [...validMessages.reverse(), ...context].slice(-maxContextMessages);
      clientContexts.set(clientId, context);

      logger.silly(`Updated context size for clientId: ${clientId}: ${context.length}`);

      const BOT_PROCESSING_TIMEOUT = 9500; // 9.5-second timeout for bot responses
      let streamClosed = false;

      const stream = new ReadableStream({
        async start(controller) {
          logger.silly(`Stream started for clientId: ${clientId}, RequestId: ${requestId}`);
          const botFunctions: BotFunction[] = [];
          addBotFunctions(botFunctions, config);

          async function processBots() {
            try {
              await Promise.race([
                executeBotFunctions(botFunctions, context, controller),
                new Promise<void>((_, reject) =>
                  setTimeout(() => reject(new Error('Timeout')), BOT_PROCESSING_TIMEOUT)
                ),
              ]);
            } catch (error) {
              handleStreamError(error, controller);
            }
          }

          // Keep the stream alive with a heartbeat every 5 seconds
          const heartbeatInterval = setInterval(() => {
            if (!streamClosed) {
              controller.enqueue('data: {"heartbeat": true}\n\n');
              logger.silly('[Stream] Heartbeat sent.');
            }
          }, 5000);

          controller.closed.finally(() => {
            clearInterval(heartbeatInterval);
            logger.info('[Stream] Controller closed.');
          }).catch((error) => {
            logger.error('[Stream] Controller close error:', error);
          });

          processBots();
        },
        cancel(reason) {
          logger.warn(`Stream cancelled for clientId: ${clientId}, RequestId: ${requestId}. Reason: ${reason}`);
          streamClosed = true;
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
      logger.error(`Error handling POST request for clientId: ${clientId}, RequestId: ${requestId}: ${error}`);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}

async function executeBotFunctions(
  botFunctions: BotFunction[],
  context: UserPrompt[],
  controller: ReadableStreamDefaultController
) {
  const responses = await Promise.all(
    botFunctions.map(async (bot) => {
      try {
        const botResponse = await bot.generate(context);
        if (botResponse) {
          const message = getMessageContent(botResponse);
          controller.enqueue(`data: ${JSON.stringify({ persona: bot.persona, message })}\n\n`);
          logger.silly(`Stream data sent for bot ${bot.persona}.`);
          context.push({ role: 'bot', content: message, persona: bot.persona });
          return true;
        }
      } catch (error) {
        logger.error(`Error processing bot ${bot.persona}: ${error}`);
      }
      return false;
    })
  );

  if (!responses.includes(true)) {
    logger.silly('No bot responded.');
    controller.enqueue('data: [DONE]\n\n');
    controller.close();
  }
}

function handleStreamError(error: any, controller: ReadableStreamDefaultController) {
  logger.error(`Stream error: ${error}`);
  controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  controller.enqueue('data: [DONE]\n\n');
  controller.close();
}
