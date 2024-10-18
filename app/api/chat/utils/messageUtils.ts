// File: app/api/chat/utils/messageUtils.ts

export function getMessageContent(messages: any[]): string {
    // Adjust the implementation based on your message structure
    return messages.map(message => message.content).join('\n');
  }
  