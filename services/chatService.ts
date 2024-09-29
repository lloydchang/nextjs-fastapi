// services/chatService.ts
export const sendMessageToChatbot = async (systemPrompt: string, input: string) => {
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
    let aggregatedResponse = '';
  
    while (reader && !done) {
      const { value, done: streamDone } = await reader.read();
      const chunk = decoder.decode(value, { stream: true });
  
      // Split and parse lines to handle each message part separately
      const lines = chunk.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line.trim());
          if (parsed.response) {
            aggregatedResponse += parsed.response;
          }
          if (parsed.done) {
            done = true;
          }
        } catch (e) {
          console.error('Failed to parse line: ', line);
        }
      }
  
      if (streamDone) break; // Exit loop if stream is finished
    }
  
    return aggregatedResponse.trim();
  };
  