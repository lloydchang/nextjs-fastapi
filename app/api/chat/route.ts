import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, AppConfig } from 'app/api/chat/utils/config';
import { checkRateLimit } from 'app/api/chat/utils/rateLimiter';
import { extractValidMessages } from 'app/api/chat/utils/filterContext';
import logger from 'app/api/chat/utils/logger';
import { validateEnvVars } from 'app/api/chat/utils/validate';
import { Mutex } from 'async-mutex';
import { BotFunction, Metric } from 'types';
import { addBotFunctions } from 'app/api/chat/controllers/BotHandlers';
import { isValidConfig } from 'app/api/chat/utils/validation';

// Add interface for bot metrics
interface BotMetric {
  persona: string;
  duration: number;
  success: boolean;
  responseSize: number;
  error?: string;  // Added error property as optional
}

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
const clientContexts = new Map<string, any[]>();

// Add monitoring for global state
setInterval(() => {
  logger.info('app/api/chat/route.ts - Global state metrics', {
    activeMutexes: clientMutexes.size,
    activeContexts: clientContexts.size,
    activeInteractions: lastInteractionTimes.size,
    memoryUsage: process.memoryUsage(),
  });
}, 300000); // Log every 5 minutes

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const startTime = Date.now();
  const clientId = request.headers.get('x-client-id') || `anon-${uuidv4()}`;
  
  const requestMetrics = {
    requestId,
    clientId,
    startTime,
    processingStages: [] as { stage: string; duration: number; timestamp: number }[],
  };

  function logStage(stage: string) {
    const timestamp = Date.now();
    const duration = timestamp - startTime;
    requestMetrics.processingStages.push({ stage, duration, timestamp });
    logger.debug(`app/api/chat/route.ts - [${requestId}] Stage completed: ${stage}`, {
      clientId,
      duration,
      totalDuration: duration,
      timestamp: new Date(timestamp).toISOString(),
    });
  }

  logger.info(`app/api/chat/route.ts - [${requestId}] Chat request initiated`, {
    clientId,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  });

  // Rate limiting check with enhanced logging
  const { limited, retryAfter } = checkRateLimit(clientId);
  logger.debug(`app/api/chat/route.ts - [${requestId}] Rate limit check`, {
    clientId,
    limited,
    retryAfter,
    timestamp: new Date().toISOString(),
  });

  if (limited) {
    logger.warn(`app/api/chat/route.ts - [${requestId}] Rate limit exceeded`, {
      clientId,
      retryAfter,
      totalDuration: Date.now() - startTime,
    });
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': `${retryAfter}` },
      }
    );
  }

  logStage('rate-limit-check');

  // Mutex management with detailed logging
  let mutex = clientMutexes.get(clientId);
  if (!mutex) {
    mutex = new Mutex();
    clientMutexes.set(clientId, mutex);
    logger.debug(`app/api/chat/route.ts - [${requestId}] New mutex created`, {
      clientId,
      totalMutexes: clientMutexes.size,
      timestamp: new Date().toISOString(),
    });
  }

  return mutex.runExclusive(async () => {
    const lockAcquiredTime = Date.now();
    logger.debug(`app/api/chat/route.ts - [${requestId}] Mutex lock acquired`, {
      clientId,
      lockWaitTime: lockAcquiredTime - startTime,
      concurrentRequests: clientMutexes.size,
    });

    lastInteractionTimes.set(clientId, Date.now());
    logStage('mutex-acquired');

    try {
      const requestBody = await request.json();
      const bodySize = JSON.stringify(requestBody).length;
      
      logger.debug(`app/api/chat/route.ts - [${requestId}] Request body parsed`, {
        clientId,
        bodySize,
        messageCount: requestBody.messages?.length ?? 0,
        contentLength: request.headers.get('content-length'),
      });

      logStage('body-parsed');

      const { messages } = requestBody;

      if (!Array.isArray(messages)) {
        logger.error(`app/api/chat/route.ts - [${requestId}] Invalid message format`, {
          clientId,
          actualType: typeof messages,
          bodyPreview: JSON.stringify(requestBody).slice(0, 200),
          totalDuration: Date.now() - startTime,
        });
        return NextResponse.json(
          { error: 'Invalid request format: messages must be an array' },
          { status: 400 }
        );
      }

      // Message validation with detailed metrics
      const validationStartTime = Date.now();
      const validMessages = messages.filter((msg: any) => {
        const isValid = msg.content && typeof msg.content === 'string' && msg.content.trim() !== '';
        if (!isValid) {
          logger.warn(`app/api/chat/route.ts - [${requestId}] Invalid message detected`, {
            clientId,
            messageContent: typeof msg.content,
            messagePreview: JSON.stringify(msg).slice(0, 100),
          });
        }
        return isValid;
      });

      logger.debug(`app/api/chat/route.ts - [${requestId}] Message validation completed`, {
        clientId,
        validationDuration: Date.now() - validationStartTime,
        originalCount: messages.length,
        validCount: validMessages.length,
        invalidCount: messages.length - validMessages.length,
        messagesSizes: validMessages.map(m => m.content.length),
      });

      logStage('messages-validated');

      if (validMessages.length === 0) {
        logger.warn(`app/api/chat/route.ts - [${requestId}] No valid messages`, {
          clientId,
          originalMessages: JSON.stringify(messages).slice(0, 500),
          totalDuration: Date.now() - startTime,
        });
        return NextResponse.json(
          { error: 'No valid messages provided' },
          { status: 400 }
        );
      }

      // Context management with metrics
      let context = clientContexts.get(clientId) || [];
      const contextUpdateStart = Date.now();
      const previousSize = context.length;
      
      context = [...validMessages.reverse(), ...context];
      context = context.slice(-maxContextMessages);
      clientContexts.set(clientId, context);

      logger.debug(`app/api/chat/route.ts - [${requestId}] Context updated`, {
        clientId,
        updateDuration: Date.now() - contextUpdateStart,
        previousSize,
        newSize: context.length,
        trimmedMessages: previousSize + validMessages.length - context.length,
        contextSizeBytes: JSON.stringify(context).length,
      });

      logStage('context-updated');

      const stream = new ReadableStream({
        async start(controller) {
          const streamStartTime = Date.now();
          const botFunctions: BotFunction[] = [];
          addBotFunctions(botFunctions, config);

          logger.debug(`app/api/chat/route.ts - [${requestId}] Stream initialized`, {
            clientId,
            botCount: botFunctions.length,
            botTypes: botFunctions.map(b => b.persona),
            initDuration: Date.now() - streamStartTime,
          });

          async function processBots() {
            const botProcessingStart = Date.now();
            const botMetrics: BotMetric[] = [];

            const botPromises = botFunctions.map(async (bot) => {
              const singleBotStart = Date.now();
              const metric: BotMetric = {
                persona: bot.persona,
                duration: 0,
                success: false,
                responseSize: 0
              };

              try {
                const botResponse = await bot.generate(context);
                const processingDuration = Date.now() - singleBotStart;
                
                metric.duration = processingDuration;
                metric.success = !!botResponse;
                metric.responseSize = botResponse?.length ?? 0;

                logger.debug(`app/api/chat/route.ts - [${requestId}] Bot response generated`, {
                  clientId,
                  botPersona: bot.persona,
                  processingDuration,
                  responseSize: botResponse?.length ?? 0,
                  success: !!botResponse,
                });

                if (botResponse && typeof botResponse === 'string') {
                  controller.enqueue(
                    `data: ${JSON.stringify({
                      persona: bot.persona,
                      message: botResponse,
                    })}\n\n`
                  );

                  context.push({
                    role: 'bot',
                    content: botResponse,
                    persona: bot.persona,
                  });
                  return true;
                }
                return false;
              } catch (error) {
                metric.success = false;
                metric.error = error instanceof Error ? error.message : 'Unknown error';
                
                logger.error(`app/api/chat/route.ts - [${requestId}] Bot processing failed`, {
                  clientId,
                  botPersona: bot.persona,
                  error: error instanceof Error ? error.stack : error,
                  duration: Date.now() - singleBotStart,
                });
                return false;
              } finally {
                botMetrics.push(metric);
              }
            });

            const results = await Promise.all(botPromises);
            const totalBotProcessing = Date.now() - botProcessingStart;

            logger.info(`app/api/chat/route.ts - [${requestId}] Bot processing completed`, {
              clientId,
              totalDuration: totalBotProcessing,
              successfulBots: results.filter(r => r).length,
              failedBots: results.filter(r => !r).length,
              botMetrics,
              finalContextSize: context.length,
            });

            logStage('bots-processed');

            // Cleanup and session management
            context = context.slice(-maxContextMessages);
            clientContexts.set(clientId, context);

            const lastInteraction = lastInteractionTimes.get(clientId) || 0;
            if (Date.now() - lastInteraction > sessionTimeout) {
              clientContexts.delete(clientId);
              lastInteractionTimes.delete(clientId);
              clientMutexes.delete(clientId);
              
              logger.info(`app/api/chat/route.ts - [${requestId}] Session cleaned up`, {
                clientId,
                sessionDuration: Date.now() - lastInteraction,
                timeout: sessionTimeout,
                remainingSessions: clientContexts.size,
              });
            }

            try {
              controller.enqueue('data: [DONE]\n\n');
              controller.close();
              
              logger.info(`app/api/chat/route.ts - [${requestId}] Request completed`, {
                clientId,
                totalDuration: Date.now() - startTime,
                stages: requestMetrics.processingStages,
                botMetrics,
                finalContextSize: context.length,
                memoryUsage: process.memoryUsage(),
              });
            } catch (error) {
              logger.error(`app/api/chat/route.ts - [${requestId}] Stream closure failed`, {
                clientId,
                error: error instanceof Error ? error.stack : error,
                totalDuration: Date.now() - startTime,
              });
            }
          }

          processBots().catch((error) => {
            logger.error(`app/api/chat/route.ts - [${requestId}] Fatal processing error`, {
              clientId,
              error: error instanceof Error ? error.stack : error,
              totalDuration: Date.now() - startTime,
              stages: requestMetrics.processingStages,
              memoryUsage: process.memoryUsage(),
            });
            controller.error(error);
          });
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (error) {
      logger.error(`app/api/chat/route.ts - [${requestId}] Request handling failed`, {
        clientId,
        error: error instanceof Error ? error.stack : error,
        totalDuration: Date.now() - startTime,
        stages: requestMetrics.processingStages,
        memoryUsage: process.memoryUsage(),
      });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
