// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, AppConfig } from 'app/api/chat/utils/config';
import { checkRateLimit } from 'app/api/chat/utils/rateLimiter';
import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import { UserPrompt } from 'types';
import logger from 'app/api/chat/utils/logger';
import { Mutex } from 'async-mutex';
import { BotFunction } from 'types';
import { addBotFunctions } from 'app/api/chat/controllers/BotHandlers';
import { isValidConfig } from 'app/api/chat/utils/validation';

type TextModelConfigKey =
  | 'ollamaGemmaTextModel'
  | 'ollamaLlamaTextModel'
  | 'cloudflareGemmaTextModel'
  | 'cloudflareLlamaTextModel'
  | 'googleVertexGemmaTextModel'
  | 'googleVertexLlamaTextModel';

const config: AppConfig = getConfig();
const MAX_PROMPT_LENGTH = 128000;
const sessionTimeout = 60 * 60 * 1000;
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
    logger.warn(`ClientId: ${clientId} exceeded rate limit. RequestId: ${requestId}`);
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  let mutex = clientMutexes.get(clientId) || new Mutex();
  clientMutexes.set(clientId, mutex);

  return mutex.runExclusive(async () => {
    lastInteractionTimes.set(clientId, Date.now());
    try {
      const body = await request.json();
      logger.debug(`Request body for RequestId: ${requestId}, clientId: ${clientId}: ${JSON.stringify(body)}`);

      const { messages } = body;
      if (!Array.isArray(messages)) {
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
      }

      const validMessages = extractValidMessages(messages);
      if (validMessages.length === 0) {
        return NextResponse.json({ error: 'No valid messages' }, { status: 400 });
      }

      let context = [...validMessages.reverse(), ...(clientContexts.get(clientId) || [])];
      context = context.slice(-maxContextMessages);
      clientContexts.set(clientId, context);

      const BOT_PROCESSING_TIMEOUT = 9500;
      let streamClosed = false;

      function safeClose(controller: ReadableStreamDefaultController) {
        if (!streamClosed) {
          streamClosed = true;
          controller.close();
        }
      }

      const stream = new ReadableStream({
        async start(controller) {
          const botFunctions: BotFunction[] = [];
          addBotFunctions(botFunctions, config);

          async function processBots() {
            try {
              await Promise.race([
                (async () => {
                  const responses = await Promise.all(
                    botFunctions.map(async (bot) => {
                      try {
                        const botResponse = await bot.generate(context);
                        if (botResponse) {
                          controller.enqueue(
                            `data: ${JSON.stringify({ persona: bot.persona, message: botResponse })}\n\n`
                          );
                          context.push({ role: 'bot', content: botResponse, persona: bot.persona });
                          return true;
                        }
                        return false;
                      } catch (error) {
                        logger.error(`Error in ${bot.persona}: ${error}`);
                        return false;
                      }
                    })
                  );

                  if (!responses.includes(true)) {
                    logger.silly(`No bots responded for clientId: ${clientId}`);
                  }

                  clientContexts.set(clientId, context.slice(-maxContextMessages));
                  safeClose(controller);
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), BOT_PROCESSING_TIMEOUT))
              ]);
            } catch (error) {
              controller.enqueue(`data: ${JSON.stringify({ error: 'Processing error' })}\n\n`);
              safeClose(controller);
            }
          }

          processBots().catch((error) => {
            controller.error(error);
            safeClose(controller);
          });
        }
      });

      return new NextResponse(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
      });
    } catch (error) {
      logger.error(`Error: ${error.message || error}`);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
