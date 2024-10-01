// services/chatService.ts
import { systemPrompt } from '../utils/systemPrompt'; // Import systemPrompt from utils/systemPrompt.ts

let previousContext: number[] | null = null; // Global context tracking

export const sendMessageToChatbot = async (
  prompt: string,
  context: number[] | null = previousContext, // Use context as an argument, with previousContext as default
  onResponse?: (message: string, newContext: number[] | null) => void
): Promise<string> => {
  const model = 'llama3.2'; // Hardcoded model value

  try {
    console.log('Sending message to chatbot API with the following parameters:');
    console.log('Model:', model);
    console.log('Prompt:', prompt);
    console.log('Context:', context);

    // Construct the JSON body with the systemPrompt, user prompt, and context
    const requestBody = JSON.stringify({
      model,
      prompt: `${systemPrompt}\nUser: ${prompt}`, // Include system prompt and user message
      context, // Pass the current context parameter if available
      stream: !onResponse, // Enable streaming if onResponse is provided
    });

    console.log('Formatted JSON body:', requestBody);

    // Send the request to the chatbot API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: requestBody, // Include the context in the body
      headers: {
        'Content-Type': 'application/json', // Use JSON Content-Type header
      },
    });

    console.log('Received raw response from server:', response);

    if (!response.ok) {
      throw new Error(`Network response was not ok. Status: ${response.status} - ${response.statusText}`);
    }

    // Handle streaming responses using TextDecoder
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to access the response body stream.');

    const decoder = new TextDecoder('utf-8');
    let done = false;
    let buffer = ''; // Buffer to hold text until a complete segment is received

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      const chunk = decoder.decode(value, { stream: true });

      try {
        const parsed = JSON.parse(chunk); // Parse each chunk as JSON

        if (parsed.response) {
          buffer += parsed.response; // Collect text in the buffer

          // Check if buffer has a complete segment (ends with allowed punctuation)
          if (/[^0-9]\.\s*$|[!?]\s*$/.test(buffer)) {
            const completeSegment = buffer.trim(); // Trim the buffer to form a complete message
            buffer = ''; // Clear buffer for next segment

            // Pass complete segment and the context to the callback
            if (onResponse) onResponse(completeSegment, parsed.context || null);
          }
        }
        done = parsed.done || streamDone; // Stop loop if stream is complete
      } catch (e) {
        console.error('Error parsing chunk:', chunk, e);
      }
    }

    // Update the context for the next request if available
    if (buffer.length > 0 && onResponse) {
      onResponse(buffer.trim(), previousContext); // Send any remaining buffer
    }

    console.log('Streaming completed');

    return buffer.trim(); // Return the final buffered response for non-streaming mode
  } catch (error) {
    console.error('Error in sendMessageToChatbot:', error.message || error);
    throw error; // Re-throw the error so it can be handled in useChat
  }
};
