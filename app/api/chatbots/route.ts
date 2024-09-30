// api/chatbots/route.ts

// moved from
// pages/api/chatbot.ts
// to
// api/chatbots/route.ts
// because of Next.js 14

// pages/api/chatbot.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { sendMessageToChatbot } from '../../services/chatService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { message, conversation } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    try {
      // Initialize response
      let reply = '';

      // Send message to chatbot service
      await sendMessageToChatbot(message, getConversationContext(conversation), (responseMessage, newContext) => {
        reply = responseMessage;
        // Optionally, handle newContext if needed
      });

      res.status(200).json({ reply });
    } catch (error) {
      console.error('Error processing chatbot request:', error);
      res.status(500).json({ error: 'Failed to process chatbot request.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to construct conversation context
const getConversationContext = (conversation: any[]): string => {
  return conversation
    .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n');
};
