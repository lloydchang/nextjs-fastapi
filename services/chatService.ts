// services/chatService.ts

import { systemPrompt } from '../utils/systemPrompt'; // Import systemPrompt from utils/systemPrompt.ts

let previousContext: number[] | null = null; // Global context tracking

export const sendMessageToChatbot = async (prompt: string): Promise<string> => {
  const model = 'llama3.2'; // Hardcoded model value

  try {
    console.log('Sending message to chatbot API with the following parameters:');
    console.log('Model:', model);
    console.log('Prompt:', prompt);
    console.log('Context:', previousContext);

    // Construct the JSON body with the systemPrompt, user prompt, and context
    const requestBody = JSON.stringify({
      model,
      prompt: `${systemPrompt}\nUser: ${prompt}`, // Include system prompt and user message
      context: previousContext, // Pass the current context parameter if available
      stream: true, // Enable streaming for a real-time response
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

    // Use a TextDecoder to handle streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to access the response body stream.');

    const decoder = new TextDecoder('utf-8');
    let done = false;
    let finalResponse = '';
    let buffer = '';

    // Process the streaming response line by line
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      if (value) {
        // Decode and accumulate the response chunks
        buffer += decoder.decode(value, { stream: true });

        // Each line in the response is a separate JSON object, split them by newlines
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          try {
            // Attempt to parse each line
            const parsed = JSON.parse(lines[i]);

            // Append the 'response' content
            if (parsed.response) {
              finalResponse += parsed.response;
            }

            // Capture the context array for the next request
            if (parsed.done && parsed.context) {
              previousContext = parsed.context;
              console.log('Updated context for next request:', previousContext);
            }
          } catch (err) {
            console.error('Error parsing line:', lines[i], err);
          }
        }

        // Save the last incomplete line back to buffer for the next iteration
        buffer = lines[lines.length - 1];
      }
      done = streamDone;
    }

    console.log('Final Response:', finalResponse);
    return finalResponse;

  } catch (error) {
    console.error('Error in sendMessageToChatbot:', error.message || error);
    throw error; // Re-throw the error so it can be handled in useChat
  }
};
