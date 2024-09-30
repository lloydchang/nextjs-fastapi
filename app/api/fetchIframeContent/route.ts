// app/api/fetchIframeContent/route.ts

// moved from
// pages/api/fetchIframeContent.ts
// to
// app/api/fetchIframeContent/route.ts
// because of Next.js 14

import type { NextApiRequest, NextApiResponse } from 'next';

interface IframeContentResponse {
  links: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<IframeContentResponse | { error: string }>) {
  if (req.method === 'GET') {
    try {
      // Replace with actual logic to fetch iframe content or related links
      // For demonstration, returning a static list
      const links = [
        'https://www.example.com',
        'https://www.anotherexample.com',
        'https://www.yetanotherexample.com',
      ];

      res.status(200).json({ links });
    } catch (error) {
      console.error('Error fetching iframe content:', error);
      res.status(500).json({ error: 'Failed to fetch iframe content.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
