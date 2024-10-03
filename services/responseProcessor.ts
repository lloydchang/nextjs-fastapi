// services/responseProcessor.ts

type ChatbotRequestBody = {
    model: string;
    prompt: string;
    temperature: number;
  };
  
  // Function to process the API response
  export const processResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>, onResponse: (message: string, newContext: string | null) => void) => {
    const decoder = new TextDecoder('utf-8');
    const sentenceEndRegex = /[^0-9]\.\s*$|[!?]\s*$/;
    let buffer = ''; // Buffer to hold text until a complete segment is received
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
      onResponse(buffer.trim(), null);
    }
  };
  