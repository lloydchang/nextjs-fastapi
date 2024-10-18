// File: app/api/chat/utils/messageUtils.ts

export function getMessageContent(botResponse: any): string {
    if (botResponse && botResponse.message) {
      return botResponse.message;
    }
    throw new Error('Invalid bot response format.');
  }
  