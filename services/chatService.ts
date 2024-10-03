// services/chatService.ts

import { sendMessageToChatbot } from './messageHandler'; // Import messageHandler

// Expose the sendMessageToChatbot function
export const initiateChat = async (
  input: string, 
  context: string | null, 
  onResponse: (message: string, newContext: string | null) => void 
) => {
  return await sendMessageToChatbot(input, context, onResponse);
};
