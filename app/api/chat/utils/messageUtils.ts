export function getMessageContent(messages: string | any[]): string {
  if (typeof messages === 'string') {
    return messages; // Directly return the string
  }

  if (Array.isArray(messages)) {
    return messages.map((message) => message.content || '').join('\n');
  }

  console.warn('getMessageContent: Invalid input', messages);
  return '';
}
