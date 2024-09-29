// services/chatService.ts
export const sendMessageToChatbot = async (systemPrompt: string, input: string, onResponse: (message: string) => void) => {
  const requestBody = {
    model: 'llama3.2',
    prompt: `${systemPrompt}\nUser: ${input}\nAssistant:`,
    temperature: 2.0,
  };

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) throw new Error(`Error: ${response.statusText}`);

  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    const chunk = decoder.decode(value, { stream: true });

    // Send the response to the chat user
    onResponse(chunk.trim());

    done = streamDone;
  }
};
