// File: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from '../../../utils/validateEnv';
import { getConfig } from '../../../utils/config';
import { generateTextWithPrimaryModel } from './handlers/generatePrimary';
import { generateTextWithFallbackModel } from './handlers/generateFallback';
import { streamResponseWithLogs, sendCompleteResponse } from './handlers/handleResponse';
import { streamErrorMessage, returnErrorResponse } from './handlers/handleErrors';
import { checkRateLimit } from '../../../utils/rateLimit';
import { sanitizeInput } from '../../../utils/stringUtils';
import { systemPrompt } from '../../../utils/systemPrompt'; // Import the centralized system prompt

validateEnv();

const config = getConfig();

export async function POST(request: NextRequest) {
  const logMessages: string[] = [];
  let generatedText = '';

  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : request.headers.get('x-real-ip') || request.ip || 'unknown';
    logMessages.push(`Client IP: ${ip}`);

    if (config.rateLimitEnabled) {
      try {
        await checkRateLimit(ip, 100);
        logMessages.push(`Rate limiting: Allowed request from IP ${ip}`);
      } catch {
        logMessages.push(`Rate limiting: Blocked request from IP ${ip}`);
        return streamErrorMessage('Too many requests. Please try again later.', logMessages, config);
      }
    } else {
      logMessages.push('Rate limiting is disabled.');
    }

    const { input, context } = await request.json();
    if (typeof input !== 'string') {
      logMessages.push('Invalid input format: "input" must be a string.');
      return streamErrorMessage('Invalid input format. "input" must be a string.', logMessages, config);
    }

    const sanitizedInput = sanitizeInput(input);
    logMessages.push(`Sanitized input: ${sanitizedInput}`);

    const prompt = context
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`
      : `${systemPrompt}\n### New Input:\nUser: ${sanitizedInput}\nAssistant:`;

    const requestBody = { model: config.primaryModel, prompt: prompt, temperature: config.temperature };

    // Check environment variables before calling the primary model
    const requiredEnvVars = [
      process.env.DEFAULT_MODEL,
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      process.env.GOOGLE_GEMINI_MODEL,
      process.env.GOOGLE_VERTEX_AI_LOCATION,
      process.env.GOOGLE_CLOUD_PROJECT
    ];

    const isEnvValid = requiredEnvVars.every(envVar => envVar && !envVar.includes('your'));

    if (!isEnvValid) {
      logMessages.push('Skipping primary model due to invalid environment configuration.');
    } else {
      try {
        generatedText = await generateTextWithPrimaryModel(requestBody, config, logMessages);
      } catch (primaryError) {
        logMessages.push(`Primary model failed: ${primaryError.message}`);
      }
    }
    if (config.fallbackModel && config.llamaEndpoint) {
      try {
        generatedText = await generateTextWithFallbackModel(requestBody.prompt, config, logMessages);
      } catch (fallbackError) {
        logMessages.push(`Fallback model failed: ${fallbackError.message}`);
        return returnErrorResponse(`${fallbackError.message}`, 500, logMessages, config);
      }
    } else {
      return returnErrorResponse('No fallback is configured.', 500, logMessages, config);
    }

    return config.streamEnabled
      ? streamResponseWithLogs(generatedText, logMessages, context, config)
      : sendCompleteResponse(generatedText, logMessages, context, config);
  } catch (error) {
    logMessages.push(`Internal Server Error: ${error.message}`);
    return returnErrorResponse('Internal Server Error', 500, logMessages, config);
  }
}
