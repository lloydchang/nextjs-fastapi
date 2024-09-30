// app/api/fetchIframeContent/route.ts

// moved from
// pages/api/fetchIframeContent.ts
// to
// app/api/fetchIframeContent/route.ts
// because of Next.js 14

// pages/api/fetchIframeContent.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Example: Fetch links from an external source or database
      const links = [
        'https://www.example.com/link1',
        'https://www.example.com/link2',
        'https://www.example.com/link3',
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
