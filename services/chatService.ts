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
      stream: false, // Disable streaming for a single response
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

    // Parse the entire response as JSON
    const result = await response.json();
    console.log('Parsed response from chatbot API:', result);

    // Check if the result contains the expected response structure
    if (!result || typeof result.response !== 'string') {
      console.error('Unexpected response format:', result);
      throw new Error('Invalid response format from chatbot service. Expected a "response" field.');
    }

    // Capture the context array for the next request
    if (result.done && result.context) {
      previousContext = result.context;
      console.log('Updated context for next request:', previousContext);
    }

    console.log('Final Response:', result.response);
    return result.response;

  } catch (error) {
    console.error('Error in sendMessageToChatbot:', error.message || error);
    throw error; // Re-throw the error so it can be handled in useChat
  }
};
