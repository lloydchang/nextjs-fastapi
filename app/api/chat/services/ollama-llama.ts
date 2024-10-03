// File: lib/ollama-llama.ts

/**
 * Sends a POST request to the local LLaMA model endpoint via Ollama and retrieves the response.
 * 
 * @param endpoint - The local Ollama LLaMA API endpoint.
 * @param prompt - The text prompt to send to the LLaMA model.
 * @param model - The model name to use for generation.
 * @returns The generated text from the LLaMA model.
 */
export async function generateFromOllamaLLaMA(endpoint: string, prompt: string, model: string): Promise<string> {
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
      throw new Error(`Ollama LLaMA Server responded with status: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let completeText = '';

    // Read the response stream and process each chunk
    while (!done) {
      const { value, done: streamDone } = await reader?.read()!;
      done = streamDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const messages = chunk.split('} {').map((msg, index, arr) => {
          // Correct the JSON format by adding braces if needed
          if (arr.length > 1) {
            if (index === 0) return msg + '}';
            if (index === arr.length - 1) return '{' + msg;
            return '{' + msg + '}';
          }
          return msg;
        });

        for (const msg of messages) {
          try {
            const parsed = JSON.parse(msg.trim());
            if (parsed.response) {
              completeText += parsed.response;
            }
          } catch (e) {
            console.error('Error parsing LLaMA response segment:', msg, e);
          }
        }
      }
    }

    return completeText.trim();
  } catch (error) {
    console.error('Error generating content from Ollama LLaMA:', error);
    throw error;
  }
}
