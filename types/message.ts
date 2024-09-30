// types/message.ts
export interface Message {
  sender: 'user' | 'bot'; // Restrict sender to 'user' or 'bot'
  text: string;
  isInterim: boolean;
}
