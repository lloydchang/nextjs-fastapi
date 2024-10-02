// services/chatService.ts
import { systemPrompt } from '../utils/systemPrompt'; // Import systemPrompt

type ChatbotRequestBody = {
  model: string;
  prompt: string;
  temperature: number;
};

// Function to send the request to a specific endpoint
const sendToEndpoint = async (endpoint: string, requestBody: ChatbotRequestBody) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to access the response body stream.');

  return reader;
};

export const sendMessageToChatbot = async (
  input: string, 
  context: string | null, // Accept context as a second argument
  onResponse: (message: string, newContext: string | null) => void // Pass newContext to the callback
) => {
  const requestBody: ChatbotRequestBody = {
    model: 'google-gemini-1.5',
    prompt: context 
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${input}\nAssistant:` 
      : `${systemPrompt}\n### New Input:\nUser: ${input}\nAssistant:`,
    temperature: 0.0,
  };

  const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;
  let reader;
  let buffer = ''; // Buffer to hold text until a complete segment is received

  // Attempt to connect to Google Gemini first
  try {
    reader = await sendToEndpoint('https://api.google.com/v1/chat/gemini', requestBody);
  } catch (remoteError) {
    console.warn('Google Gemini API failed, falling back to local LLaMA model:', remoteError);

    // Modify the request body for local LLaMA 3.2
    requestBody.model = 'llama3.2';

    // Attempt to connect to local LLaMA model
    try {
      reader = await sendToEndpoint('http://localhost:11434/api/generate', requestBody);
    } catch (localError) {
      console.error('Both remote and local chatbot services failed:', localError);
      throw localError; // Re-throw the error if both services fail
    }
  }

  // If reader is successfully obtained from either service
  const decoder = new TextDecoder('utf-8');
  let done = false;

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

          // Pass complete segment and the context to the callback
          onResponse(completeSegment, parsed.context || null);
        }
      }
      done = parsed.done || streamDone;
    } catch (e) {
      console.error('Error parsing chunk:', chunk, e);
    }
  }

  // Ensure remaining buffer (if any) is sent to the callback
  if (buffer.length > 0) {
    onResponse(buffer.trim(), context);
  }
};
