// components/TranscriptFetcher.tsx

import React, { useEffect, useCallback } from "react";
import axios from "axios";

interface TranscriptFetcherProps {
  url: string;
  onFetchComplete: (transcript: string) => void;
  onError: (error: string, details?: string) => void;
  addLog: (message: string) => void;
}

const TranscriptFetcher: React.FC<TranscriptFetcherProps> = ({
  url,
  onFetchComplete,
  onError,
  addLog,
}) => {
  const scrapeTranscript = useCallback(async () => {
    addLog('Starting to scrape transcript...');
    const transcriptUrl = `${url}/transcript?subtitle=en`;

    try {
      const response = await axios.get(transcriptUrl);
      addLog(`HTTP Response Status: ${response.status}`);

      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');
      const transcriptElement = doc.querySelector('.talk-transcript__paragraph');

      if (!transcriptElement) {
        throw new Error('Transcript element not found in the HTML.');
      }

      const text = transcriptElement.textContent || '';
      addLog('Transcript Text: ' + text);
      onFetchComplete(text);
    } catch (err) {
      addLog("Error during transcript scraping.");
      if (axios.isAxiosError(err)) {
        onError(`Failed to scrape the transcript from ${url}.`, err.message);
      } else {
        onError(`Network error occurred while scraping transcript.`, err.message);
      }
    }
  }, [url, addLog, onFetchComplete, onError]);

  useEffect(() => {
    scrapeTranscript();
  }, [scrapeTranscript]);

  return null;
};

export default TranscriptFetcher;
