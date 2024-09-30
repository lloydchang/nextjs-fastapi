// services/chatService.ts
import { systemPrompt } from '../utils/systemPrompt'; // Import systemPrompt

export const sendMessageToChatbot = async (
  input: string, 
  context: string | null, // Accept context as a second argument
  onResponse: (message: string, newContext: string | null) => void // Pass newContext to the callback
) => {
  // Include context in the prompt if available
  const requestBody = {
    model: 'llama3.2',
    // Include the full conversation context in the prompt
    prompt: context ? `${systemPrompt}\n${context}\nUser: ${input}\nAssistant:` : `${systemPrompt}\nUser: ${input}\nAssistant:`,
    temperature: 2.0,
  };

  try {
    // Send POST request to the chatbot API
    const response = await fetch(process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to access the response body stream.');

    const decoder = new TextDecoder('utf-8');
    let done = false;
    let buffer = ''; // Buffer to hold text until a complete segment is received

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      const chunk = decoder.decode(value, { stream: true });

      try {
        const parsed = JSON.parse(chunk);
        if (parsed.response) {
          buffer += parsed.response; // Collect text in the buffer

          // Check if buffer has a complete segment (ends with allowed punctuation)
          // Period if not followed by a digit
          if (/[^0-9]\.\s*$|[!?]\s*$/.test(buffer)) {
            const completeSegment = buffer.trim(); // Trim the buffer to form a complete message
            buffer = ''; // Clear buffer for next segment

            // Pass complete segment and the context to the callback
            onResponse(completeSegment, parsed.context || null);
          }
        }
        done = parsed.done || streamDone; // Stop loop if stream is complete
      } catch (e) {
        console.error('Error parsing chunk:', chunk, e);
      }
    }
  } catch (error) {
    console.error('Error sending message to chatbot:', error);
    throw error;
  }
};
