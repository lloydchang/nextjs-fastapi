import { validateEnvVars } from '../utils/validate';
import logger from '../utils/log';
import { systemPrompt } from '../utils/prompt';

let hasWarnedOllamaLlama = false;

export async function generateFromOllamaLlama(params: {
  endpoint: string;
  prompt: string;
  model: string;
}): Promise<string | null> {
  const optionalVars = ['OLLAMA_LLAMA_MODEL', 'OLLAMA_LLAMA_ENDPOINT'];
  const isValid = validateEnvVars(optionalVars);
  if (!isValid) {
    if (!hasWarnedOllamaLlama) {
      logger.warn(`[Ollama Llama Warning] Optional environment variables are missing or contain invalid placeholders: ${optionalVars.join(', ')}`);
      hasWarnedOllamaLlama = true;
    }
    return null;
  }

  const { endpoint, prompt, model } = params;
  const combinedPrompt = `${systemPrompt}\nUser Prompt: ${prompt}`;
  logger.debug(`[Ollama Llama Service] Sending request to Ollama Llama: Endpoint = ${endpoint}, Model = ${model}, Prompt = ${combinedPrompt}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ prompt: combinedPrompt, model }),
    });

    if (!response.ok) {
      logger.warn(`Ollama Llama Service responded with status: ${response.status} - ${response.statusText}`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to access the response body stream.');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let done = false;
    const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      const chunk = decoder.decode(value, { stream: true });

      try {
        const parsed = JSON.parse(chunk);
        if (parsed.response) {
          buffer += parsed.response;

          // Check if buffer has a complete segment
          if (sentenceEndRegex.test(buffer)) {
            const completeSegment = buffer.trim();
            buffer = ''; // Clear buffer for next segment

            logger.info(`[Ollama Llama Service] Processed segment: ${completeSegment}`);
          }
        }
        done = parsed.done || streamDone;
      } catch (e) {
        logger.error('Error parsing chunk:', chunk, e);
      }
    }

    // Return final buffer if there's remaining text
    return buffer.trim();
  } catch (error) {
    logger.warn(`[Ollama Llama Service] Error generating content from Ollama Llama: ${error}`);
    return null;
  }
}
