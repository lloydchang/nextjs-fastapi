export function getMessageContent(messages: any[]): string {
  if (!Array.isArray(messages)) {
    console.warn('getMessageContent: messages is not an array', messages);
    return '';
  }  

  return messages.map((message) => message.content || '').join('\n');
}
