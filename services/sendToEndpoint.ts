// services/sendToEndpoint.ts

type ChatbotRequestBody = {
    model: string;
    prompt: string;
    temperature: number;
  };
  
  // Function to send the request to a specific endpoint
  export const sendToEndpoint = async (endpoint: string, requestBody: ChatbotRequestBody, apiKey?: string) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
  
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
    }
  
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to access the response body stream.');
  
    return reader;
  };
  