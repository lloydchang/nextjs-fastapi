// File: app/api/chat/services/serveOllamaGemma.ts

/**
 * Sends a POST request to the local Ollama Gemma model endpoint and retrieves the response.
 * @param endpoint - The local Ollama Gemma API endpoint.
 * @param prompt - The text prompt to send to the Gemma model.
 * @param model - The model name to use for generation.
 * @returns The generated text from the Ollama Gemma model.
 */
export async function generateFromOllamaGemma(endpoint: string, prompt: string, model: string): Promise<string> {
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
        throw new Error(`Ollama Gemma Server responded with status: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
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
                console.error('Error parsing Gemma response segment:', line, parseError);
              }
            }
          }
        }
      }
  
      if (buffer.trim()) {
        try {
          const remainingParsed = JSON.parse(buffer.trim());
          if (remainingParsed.response) {
            completeText += remainingParsed.response;
          }
        } catch (finalParseError) {
          console.error('Error parsing remaining Gemma response segment:', buffer, finalParseError);
        }
      }
  
      return completeText.trim();
    } catch (error) {
      console.error('Error generating content from Ollama Gemma:', error);
      throw error;
    }
  }
  