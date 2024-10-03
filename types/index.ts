// types/index.ts

export type ChatbotRequestBody = {
    model: string;
    prompt: string;
    temperature: number;
  };
  
  export type ResponseSegment = {
    message: string;
    context: string | null;
  };
  