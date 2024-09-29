// Chat service to handle communication with the chatbot backend
export const sendMessageToChatbot = async (systemPrompt: string, input: string) => {
    const requestBody = {
      model: "llama3.2",
      prompt: `${systemPrompt}\nUser: ${input}\nAssistant:`,
      temperature: 2.0,
    };
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let responseMessage = "";
  
    while (reader && !done) {
      const { value, done: streamDone } = await reader.read();
      responseMessage += decoder.decode(value, { stream: true });
      if (streamDone) done = true;
    }
  
    return responseMessage.trim();
  };
  