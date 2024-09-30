// services/chatService.ts

export const sendMessageToChatbot = async (prompt: string): Promise<string> => {
  const model = 'llama3.2'; // Hardcoded model value

  try {
    console.log('Sending message to chatbot API with the following parameters:');
    console.log('Model:', model);
    console.log('Prompt:', prompt);

    // Construct the JSON body string exactly as in the curl request
    const requestBody = JSON.stringify({
      model,
      prompt,
    });

    console.log('Formatted JSON body:', requestBody);

    // Send the request to the chatbot API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: requestBody, // Only specify the body, similar to how curl handles it
      // Remove Content-Type header to match curl behavior
    });

    console.log('Received raw response from server:', response);

    if (!response.ok) {
      throw new Error(`Network response was not ok. Status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Parsed response from chatbot API:', data);

    if (!data || typeof data.response !== 'string') {
      throw new Error('Invalid response format from chatbot service. Expected a "response" field.');
    }

    return data.response; // Return the chatbot's reply
  } catch (error) {
    console.error('Error in sendMessageToChatbot:', error.message || error);
    throw error; // Re-throw the error so it can be handled in useChat
  }
};
