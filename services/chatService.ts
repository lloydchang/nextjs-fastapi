// services/chatService.ts
export const sendMessageToChatbot = async (
  systemPrompt: string, 
  input: string, 
  onResponse: (message: string) => void
) => {
  // Construct request body
  const requestBody = {
    model: 'llama3.2',
    prompt: `${systemPrompt}\nUser: ${input}\nAssistant:`,
    temperature: 2.0,
  };

  try {
    // Send POST request to the chatbot API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
    }

    // Obtain a reader from the response body
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to access the response body stream.');

    const decoder = new TextDecoder('utf-8');
    let done = false;
    let cumulativeResponse = ''; // To store the progressively built response

    // Read and parse the response stream
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      const chunk = decoder.decode(value, { stream: true });

      // Attempt to parse the chunk
      try {
        const parsed = JSON.parse(chunk); // Parse the entire chunk as JSON
        if (parsed.response) {
          if (cumulativeResponse.length === 0) {
            cumulativeResponse = parsed.response; // Start with the first message
          } else {
            cumulativeResponse += `, ${parsed.response}`; // Append subsequent messages
          }
          onResponse(cumulativeResponse); // Update the response progressively
        }
        done = parsed.done || streamDone; // End loop if complete
      } catch (e) {
        console.error('Error parsing chunk:', chunk, e);
      }
    }
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw error; // Propagate the error to be handled by the caller
  }
};
