// File: app/api/proxyTranscript/route.ts

import { NextResponse } from 'next/server';
import logger from 'app/api/chat/utils/logger';

// Function to extract transcript using a more flexible approach
const extractTranscript = (html: string): string => {
  logger.silly("app/api/proxyTranscript/route.ts - Starting transcript extraction from HTML...");
  
  // Match JSON-like structure that may contain the transcript
  const jsonMatch = html.match(/"transcript":\s*"(.*?)",/);
  if (!jsonMatch || jsonMatch.length < 2) {
    logger.error("app/api/proxyTranscript/route.ts - Error: Could not find transcript in the HTML. The transcript structure may have changed.");
    
    // Log the HTML snippet for analysis
    logger.error(`app/api/proxyTranscript/route.ts - HTML Snippet for Debugging: ${html.substring(0, 500)}`);
    return 'Failed to retrieve transcript. Transcript structure may have changed.';
  }

  // Extract the transcript, handling special characters
  const rawTranscript = jsonMatch[1];
  const decodedTranscript = rawTranscript
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0027/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\\n/g, ' ');

  logger.silly("app/api/proxyTranscript/route.ts - Transcript successfully extracted and decoded."); // This log is sufficient
  return decodedTranscript.trim();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transcriptUrl = searchParams.get('transcriptUrl');

  logger.silly(`app/api/proxyTranscript/route.ts - Incoming request with transcriptUrl: ${transcriptUrl}`);

  if (!transcriptUrl || typeof transcriptUrl !== 'string') {
    logger.error(`app/api/proxyTranscript/route.ts - Missing or invalid transcript URL: ${transcriptUrl}`);
    return NextResponse.json({ error: 'Missing or invalid transcript URL' }, { status: 400 });
  }

  try {
    logger.silly(`app/api/proxyTranscript/route.ts - Fetching transcript from URL: ${transcriptUrl}`);
    
    // Use the native fetch API to get the HTML content
    const response = await fetch(transcriptUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.91 Safari/537.36'
      }
    });

    if (!response.ok) {
      logger.error(`app/api/proxyTranscript/route.ts - Failed to fetch transcript. Status: ${response.status} - ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch transcript. Status: ${response.status} - ${response.statusText}` }, { status: response.status });
    }

    // Read the response content as text
    const html = await response.text();

    logger.silly(`app/api/proxyTranscript/route.ts - Successfully fetched HTML content using fetch.`);
    
    // Log a snippet of the fetched HTML for debugging
    logger.silly(`app/api/proxyTranscript/route.ts - Fetched HTML Snippet: ${html.substring(0, 500)}`);

    // Extract and decode the transcript
    const transcript = extractTranscript(html);

    if (transcript.startsWith("Failed to retrieve")) {
      logger.error("app/api/proxyTranscript/route.ts - Transcript extraction failed. The transcript structure may have changed.");
    }

    return NextResponse.json({ transcript }, { status: 200 });
  } catch (error) {
    logger.error(`app/api/proxyTranscript/route.ts - Error fetching transcript: ${error}`);
    return NextResponse.json({ error: `Error fetching transcript: ${error}` }, { status: 500 });
  }
}
