// File: app/api/proxyTranscript/route.ts

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import logger from 'app/api/chat/utils/logger';

// Helper function to run curl as a subprocess and capture its output
const runCurlCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error executing curl command: ${error.message}`);
        logger.error(`Detailed stderr output from curl: ${stderr}`);
        reject(`Error executing curl: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
};

// Function to extract transcript using a more flexible approach
const extractTranscript = (html: string): string => {
  logger.debug("Starting transcript extraction from HTML...");
  
  // Match JSON-like structure that may contain the transcript
  const jsonMatch = html.match(/"transcript":\s*"(.*?)",/);
  if (!jsonMatch || jsonMatch.length < 2) {
    logger.error("Error: Could not find transcript in the HTML. The transcript structure may have changed.");
    
    // Log the HTML snippet for analysis
    logger.error(`HTML Snippet for Debugging: ${html.substring(0, 500)}`);
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

  logger.debug("Transcript successfully extracted and decoded.");
  return decodedTranscript.trim();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transcriptUrl = searchParams.get('transcriptUrl');

  logger.debug(`Incoming request with transcriptUrl: ${transcriptUrl}`);

  if (!transcriptUrl || typeof transcriptUrl !== 'string') {
    logger.error(`Missing or invalid transcript URL: ${transcriptUrl}`);
    return NextResponse.json({ error: 'Missing or invalid transcript URL' }, { status: 400 });
  }

  // Construct the basic curl command for fetching the transcript without additional headers
  const curlCommand = `curl -s -L "${transcriptUrl}"`;

  logger.debug(`Constructed curl command for debugging:\n${curlCommand}`);
  
  try {
    logger.debug(`Executing curl command to fetch transcript...`);

    // Run the curl command as a subprocess
    const html = await runCurlCommand(curlCommand);

    logger.debug(`Successfully fetched HTML content using curl.`);
    
    // Log the exact curl command executed for easy copy-pasting
    logger.debug(`Executed curl command:\n${curlCommand}`);

    // Log a snippet of the fetched HTML for debugging
    logger.debug(`Fetched HTML Snippet: ${html.substring(0, 500)}`);

    logger.debug(`Starting transcript extraction from HTML...`);
    const transcript = extractTranscript(html);

    if (transcript.startsWith("Failed to retrieve")) {
      logger.error("Transcript extraction failed. The transcript structure may have changed.");
    } else {
      logger.debug("Transcript successfully extracted and decoded.");
    }

    return NextResponse.json({ transcript }, { status: 200 });
  } catch (error) {
    logger.error(`Error fetching transcript using curl: ${error}`);
    return NextResponse.json({ error: `Error fetching transcript using curl: ${error}` }, { status: 500 });
  }
}
