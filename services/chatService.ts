// services/chatService.ts
import { systemPrompt } from '../utils/systemPrompt'; // Import systemPrompt

// Define provider URLs and headers
const providerUrls = {
  ollama: 'http://localhost:11434/api/generate',
  google: 'https://api.generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generateText',
  aws: 'https://api.aws.amazon.com/titan-text-embeddings-v2/generate',
};

const providerHeaders = {
  ollama: { 'Content-Type': 'application/json' },
  google: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''}` },
  aws: { 'Content-Type': 'application/json' },
};

const providerOrder = ['ollama', 'google', 'aws'];

const getRequestBody = (provider: string, input: string, context: string | null) => {
  const basePrompt = context
    ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${input}\nAssistant:`
    : `${systemPrompt}\n### New Input:\nUser: ${input}\nAssistant:`;

  switch (provider) {
    case 'google':
      return { prompt: { context: basePrompt }, temperature: 0.0 };
    case 'aws':
      return { input: basePrompt };
    default:
      return { model: 'llama3.2', prompt: basePrompt, temperature: 0.0 };
  }
};

export const sendMessageToChatbot = async (
  input: string, 
  context: string | null, // Accept context as a second argument
  onResponse: (message: string, newContext: string | null) => void // Pass newContext to the callback
) => {
  let lastError: Error | null = null; // Track the last error for fallback

  for (const provider of providerOrder) { // Iterate over each provider
    try {
      const requestBody = getRequestBody(provider, input, context); // Generate request body based on provider
      const url = providerUrls[provider]; // Get the appropriate URL
      const headers = providerHeaders[provider]; // Get headers based on provider

      // Send POST request to the appropriate chatbot API based on the provider
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to access the response body stream.');

      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = ''; // Buffer to hold text until a complete segment is received

      // Regex to match sentence-ending punctuation: Period (not followed by a digit), Question mark, Exclamation mark
      const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });

        try {
          const parsed = JSON.parse(chunk);
          if (parsed.response) {
            buffer += parsed.response; // Collect text in the buffer

            // Check if buffer has a complete segment (ends with allowed punctuation)
            if (sentenceEndRegex.test(buffer)) {
              const completeSegment = buffer.trim(); // Trim the buffer to form a complete message
              buffer = ''; // Clear buffer for next segment

              // Pass complete segment and the context to the callback
              onResponse(completeSegment, parsed.context || null);
            }
          }
          done = parsed.done || streamDone; // Stop loop if stream is complete
        } catch (e) {
          console.error('Error parsing chunk:', chunk, e);
        }
      }

      // Ensure remaining buffer (if any) is sent to the callback after the stream ends
      if (buffer.length > 0) {
        onResponse(buffer.trim(), context);
      }
      return; // Successful response, exit the loop
    } catch (error) {
      console.error(`Error sending message to ${provider}:`, error);
      lastError = error as Error;
    }
  }

  if (lastError) throw lastError; // Throw the last error if all providers failed
};
