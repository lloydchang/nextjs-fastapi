// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from 'app/api/chat/utils/config';
import { handleTextWithOllamaGemmaTextModel } from 'app/api/chat/controllers/OllamaGemmaController';
import { handleTextWithCloudflareGemmaTextModel } from 'app/api/chat/controllers/CloudflareGemmaTextModel';
import { handleTextWithGoogleVertexGemmaTextModel } from 'app/api/chat/controllers/GoogleVertexGemmaTextModel';
import { handleTextWithOllamaLlamaTextModel } from 'app/api/chat/controllers/OllamaLlamaController';
import { handleTextWithCloudflareLlamaTextModel } from 'app/api/chat/controllers/CloudflareLlamaTextModel';
import { handleTextWithGoogleVertexLlamaTextModel } from 'app/api/chat/controllers/GoogleVertexLlamaTextModel';
import { buildPrompt } from 'app/api/chat/utils/promptBuilder';
import logger from 'app/api/chat/utils/logger';

const config = getConfig();

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request format or no messages provided.' }, { status: 400 });
    }

    // Initial context includes recent user messages only
    let context = messages.slice(-7); // Keep the 7 most recent messages for context

    // Create a ReadableStream to send responses to the client in real-time
    const stream = new ReadableStream({
      async start(controller) {
        logger.silly(`Started streaming responses to the client.`);

        // Define bot personas and their generation functions
        const botFunctions = [
          {
            persona: 'Ollama Gemma',
            generate: (currentContext: any[]) =>
              config.ollamaGemmaTextModel
                ? handleTextWithOllamaGemmaTextModel(
                    { userPrompt: buildPrompt(currentContext), textModel: config.ollamaGemmaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Cloudflare Gemma',
            generate: (currentContext: any[]) =>
              config.cloudflareGemmaTextModel
                ? handleTextWithCloudflareGemmaTextModel(
                    { userPrompt: buildPrompt(currentContext), textModel: config.cloudflareGemmaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Google Vertex Gemma',
            generate: (currentContext: any[]) =>
              config.googleVertexGemmaTextModel
                ? handleTextWithGoogleVertexGemmaTextModel(
                    { userPrompt: buildPrompt(currentContext), textModel: config.googleVertexGemmaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Ollama Llama',
            generate: (currentContext: any[]) =>
              config.ollamaLlamaTextModel
                ? handleTextWithOllamaLlamaTextModel(
                    { userPrompt: buildPrompt(currentContext), textModel: config.ollamaLlamaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Cloudflare Llama',
            generate: (currentContext: any[]) =>
              config.cloudflareLlamaTextModel
                ? handleTextWithCloudflareLlamaTextModel(
                    { userPrompt: buildPrompt(currentContext), textModel: config.cloudflareLlamaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
          {
            persona: 'Google Vertex Llama',
            generate: (currentContext: any[]) =>
              config.googleVertexLlamaTextModel
                ? handleTextWithGoogleVertexLlamaTextModel(
                    { userPrompt: buildPrompt(currentContext), textModel: config.googleVertexLlamaTextModel },
                    config
                  )
                : Promise.resolve(null),
          },
        ];

        // Set a maximum number of iterations to control the conversation length
        const maxIterations = 10; // Increase iterations for deeper multi-turn strategies
        let iteration = 0;

        // Define a reasoning and acting function for each bot
        const reasoningAndActingFunctions = botFunctions.map((bot) => ({
          persona: bot.persona,
          reasonAndAct: async (context: any[]) => {
            const generatedResponse = await bot.generate(context);
            if (!generatedResponse || typeof generatedResponse !== 'string') return null;

            let finalResponse = generatedResponse;
            const recentResponses = context.slice(-5);
            const userMessages = context.filter((msg) => msg.role === 'user');

            // Enhanced Reasoning and Acting Strategies

            // 1. **Holistic Impact Analysis**
            if (userMessages.some((msg) => msg.content.includes('impact') || msg.content.includes('considerations'))) {
              finalResponse = `Let’s consider the broader impact of this decision—not just practically, but also emotionally, socially, and ethically. Here’s a holistic analysis: ${finalResponse}`;
            }

            // 2. **Reverse Engineering for Goal Achievement**
            if (userMessages.some((msg) => msg.content.includes('goal') || msg.content.includes('achieve'))) {
              finalResponse = `To achieve this goal, let’s work backward and break it down into smaller, actionable steps. Here’s how we could reverse-engineer it: ${finalResponse}`;
            }

            // 3. **Strength-Based Reframing**
            if (userMessages.some((msg) => msg.content.includes('challenge') || msg.content.includes('difficult'))) {
              finalResponse = `This challenge could be a great opportunity to use your strength in X. Let’s reframe this and approach it in a way that leverages your unique skills: ${finalResponse}`;
            }

            // 4. **"Path of Least Resistance" Exploration**
            if (userMessages.some((msg) => msg.content.includes('tired') || msg.content.includes('low motivation'))) {
              finalResponse = `It seems like motivation is low right now, and that’s okay. Let’s explore the path of least resistance—an easy action that still moves you forward: ${finalResponse}`;
            }

            // 5. **Emotional Energy Budgeting**
            if (userMessages.some((msg) => msg.content.includes('draining') || msg.content.includes('energy'))) {
              finalResponse = `Let’s take into account how different activities might impact your emotional energy. We can plan to allocate your energy where it matters most: ${finalResponse}`;
            }

            // 6. **Behavioral Sequence Prediction**
            if (userMessages.some((msg) => msg.content.includes('if I do this') || msg.content.includes('outcome'))) {
              finalResponse = `If you take this action, it’s likely to trigger a series of events. Let’s try to anticipate how this behavioral sequence could unfold: ${finalResponse}`;
            }

            // 7. **Cognitive Flexibility Practice**
            if (userMessages.some((msg) => msg.content.includes('perspective') || msg.content.includes('viewpoint'))) {
              finalResponse = `Let’s practice cognitive flexibility. How might this problem look from a completely different perspective? This can help expand our problem-solving options: ${finalResponse}`;
            }

            // 8. **Implicit Value Discovery**
            if (userMessages.some((msg) => msg.content.includes('feels right') || msg.content.includes('intuitively'))) {
              finalResponse = `It seems like this decision resonates with a deeper value you hold. Let’s explore what that value might be—it could help clarify why this feels important: ${finalResponse}`;
            }

            // 9. **Temporary Detachment for Perspective Gain**
            if (userMessages.some((msg) => msg.content.includes('stuck') || msg.content.includes('can’t decide'))) {
              finalResponse = `It sounds like you’re feeling stuck. Let’s detach from this for a bit—sometimes stepping away can bring a fresh perspective when we return: ${finalResponse}`;
            }

            // 10. **Interconnected Decision Mapping**
            if (userMessages.some((msg) => msg.content.includes('affect') || msg.content.includes('other areas'))) {
              finalResponse = `Let’s map out how this decision might affect other areas of your life. Understanding these interconnections can help you make a more integrated choice: ${finalResponse}`;
            }

            return finalResponse;
          },
        }));

        async function processBots() {
          while (iteration < maxIterations) {
            iteration++;
            logger.silly(`Iteration ${iteration}: Current context: ${JSON.stringify(context)}`);

            // Each bot will generate a response and reason/act upon it
            const responses = await Promise.all(
              reasoningAndActingFunctions.map((bot) => bot.reasonAndAct(context))
            );

            // If no responses, end the loop early
            let hasResponse = false;

            // Process each bot response and add it to the context and stream
            for (let index = 0; index < responses.length; index++) {
              const response = responses[index];
              if (response && typeof response === 'string') {
                const botPersona = botFunctions[index].persona;

                logger.silly(`Response from ${botPersona}: ${response}`);

                // Add to the context for other bots to use
                context.push({ role: 'bot', content: response, persona: botPersona });

                // Stream this response immediately to the client with data prefix
                controller.enqueue(`data: ${JSON.stringify({
                  persona: botPersona,
                  message: response,
                })}\n\n`);

                hasResponse = true;
              }
            }

            // If no bots generated a response, terminate the loop
            if (!hasResponse) {
              logger.silly(`No bot responded in iteration ${iteration}. Ending interaction.`);
              break;
            }
          }

          // Send a completion message to indicate the end of the stream
          controller.enqueue('data: [DONE]\n\n');
          controller.close();
        }

        // Start the bot processing loop
        processBots().catch((error) => {
          logger.error(`Error in streaming bot interaction: ${error}`);
          controller.error(error);
        });
      },
    });

    // Return the streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    logger.error(`Error in streaming bot interaction: ${error}`);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
