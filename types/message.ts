// types/message.ts
// Message types for chat interactions
export interface Message {
  sender: string;
  text: string;
  isInterim?: boolean;
}
