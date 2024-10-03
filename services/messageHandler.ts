// services/messageHandler.ts

import { sendToEndpoint } from './sendToEndpoint'; // Import sendToEndpoint
import { selectService } from './serviceSelector'; // Import serviceSelector
import { processResponse } from './responseProcessor'; // Import responseProcessor
import { systemPrompt } from '../utils/systemPrompt'; // Import systemPrompt

type ChatbotRequestBody = {
  model: string;
  prompt: string;
  temperature: number;
};

// Send message and handle response
export const sendMessageToChatbot = async (
  input: string, 
  context: string | null, 
  onResponse: (message: string, newContext: string | null) => void 
) => {
  const requestBody: ChatbotRequestBody = {
    model: '', 
    prompt: context 
      ? `${systemPrompt}\n${context}\n\n### New Input:\nUser: ${input}\nAssistant:` 
      : `${systemPrompt}\n### New Input:\nUser: ${input}\nAssistant:`,
    temperature: 0.0,
  };

  const service = selectService(); // Get the next valid service

  requestBody.model = service.model; // Set model based on selected service

  try {
    const reader = await sendToEndpoint(service.endpoint, requestBody, service.apiKey);
    await processResponse(reader, onResponse); // Process the response
  } catch (error) {
    console.warn(`${service.model} failed. Please try again.`, error);
    throw new Error('Connection failed to the selected service.');
  }
};
