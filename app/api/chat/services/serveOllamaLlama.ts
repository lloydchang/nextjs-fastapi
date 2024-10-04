// File: app/api/chat/services/serveOllamaLlama.ts

/**
 * Sends a POST request to the local Ollama Llama model endpoint and retrieves the response.
 * @param endpoint - The local Ollama Llama API endpoint.
 * @param prompt - The text prompt to send to the Llama model.
 * @param model - The model name to use for generation.
 * @returns The generated text from the Llama model.
 */
export async function generateFromOllamaLlama(endpoint: string, prompt: string, model: string): Promise<string> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama Llama Server responded with status: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let completeText = '';

    let buffer = '';
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader!.read();
      done = streamDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        let lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line.trim());
              if (parsed.response) {
                completeText += parsed.response;
              }
            } catch (parseError) {
              console.error('Error parsing Llama response segment:', line, parseError);
            }
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        const remainingParsed = JSON.parse(buffer.trim());
        if (remainingParsed.response
