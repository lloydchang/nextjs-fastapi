// tests/testChat.ts

const { initiateChat } = require('../services/chatService');


const testChat = async () => {
  try {
    await initiateChat('Hello, LLaMA!', null, (message: string, newContext: Record<string, unknown>) => {
      console.log(message);
      console.log(newContext);
      console.log('Bot Response:', message);
    });
  } catch (error) {
    console.error('Error during chat:', (error as Error).message);
  }
};

testChat();
