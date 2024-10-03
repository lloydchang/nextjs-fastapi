// tests/testChat.ts

import { initiateChat } from '../services/chatService';

const testChat = async () => {
  try {
    await initiateChat('Hello, LLaMA!', null, (message, newContext) => {
      console.log('Bot Response:', message);
    });
  } catch (error) {
    console.error('Error during chat:', (error as Error).message);
  }
};

testChat();
