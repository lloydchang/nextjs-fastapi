// File: app/api/chat/services/ollama-llama.ts

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
    let completeText = '';

    // Use a buffer to accumulate data and split on newline boundaries
    let buffer = '';
    let done = false;

    // Read the response stream and process each chunk
    while (!done) {
      const { value, done: streamDone } = await reader!.read();
      done = streamDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk; // Accumulate chunks in the buffer

        // Process buffer by splitting on newline delimiters
        let lines = buffer.split('\n');
        buffer = lines.pop()!; // Save the last (possibly incomplete) line in the buffer

        // Process each complete line
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line.trim());
              if (parsed.response) {
                completeText += parsed.response;
              }
            } catch (parseError) {
              console.error('Error parsing LLaMA response segment:', line, parseError);
            }
          }
        }
      }
    }

    // Handle any remaining content in the buffer after the stream ends
    if (buffer.trim()) {
      try {
        const remainingParsed = JSON.parse(buffer.trim());
        if (remainingParsed.response) {
          completeText += remainingParsed.response;
        }
      } catch (finalParseError) {
        console.error('Error parsing remaining LLaMA response segment:', buffer, finalParseError);
      }
    }

    return completeText.trim();
  } catch (error) {
    console.error('Error generating content from Ollama LLaMA:', error);
    throw error;
  }
}
