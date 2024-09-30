// services/chatService.ts

export const sendMessageToChatbot = async (input: string, context: string): Promise<string> => {
  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, context }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.reply; // Assuming the API returns { reply: "..." }
  } catch (error) {
    console.error('Error in sendMessageToChatbot:', error);
    throw error;
  }
};
