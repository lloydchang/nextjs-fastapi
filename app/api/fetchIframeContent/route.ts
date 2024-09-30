// app/api/fetchIframeContent/route.ts
"use server";

import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

// Server-side API route for fetching iframe content
export async function GET() {
  const iframeUrl = 'https://lloydchang.github.io/open-sdg-open-sdg-site-starter-site/reporting-status/';

  try {
    const response = await fetch(iframeUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch iframe content' }, { status: response.status });
    }

    const content = await response.text();

    // Use `jsdom` for server-side HTML parsing
    const dom = new JSDOM(content);
    const doc = dom.window.document;

    // Extract all links using `jsdom`
    const links = Array.from(doc.querySelectorAll('a')).map(link => link.href);

    return NextResponse.json({ links, content }); // Return the extracted links and content
  } catch (error) {
    console.error('Error fetching iframe content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
