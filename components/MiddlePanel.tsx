// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';
import { useChatContext } from '../context/ChatContext';
import DebugPanel from './DebugPanel'; // Import DebugPanel
import axios from 'axios'; // Import axios

// TypeScript Types
type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

// List of SDG keywords
const sdgKeywords = [
  'poverty', 'hunger', 'health', 'education', 'gender',
  'water', 'energy', 'work', 'industry', 'inequality',
  'city', 'consumption', 'climate', 'ocean', 'land',
  'peace', 'partnership'
];

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const { sendActionToChatbot } = useChatContext();

  // Track whether the initial keyword has been set
  const initialKeyword = useRef<string>(""); // No initial value
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [transcriptSaved, setTranscriptSaved] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]); // State to hold logs for DebugPanel
  const [errorDetails, setErrorDetails] = useState<string>(''); // State for error details

  // Helper function to add logs
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Update logs state
  };

  // Function to determine the initial keyword based on randomization
  const determineInitialKeyword = () => {
    const randomIndex = Math.floor(Math.random() * sdgKeywords.length);
    return sdgKeywords[randomIndex];
  };

  // Function to scrape the transcript using axios
  const scrapeTranscript = async (url: string) => {
    addLog('Starting to scrape transcript...');
    const transcriptUrl = `${url}/transcript?subtitle=en`;
    addLog(`Fetching transcript from: ${transcriptUrl}`);

    try {
      const response = await axios.get(transcriptUrl, {
        headers: {
          'User-Agent': 'curl/7.68.0', // Simulate curl user agent
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.ted.com/',
          'Connection': 'keep-alive',
          'DNT': '1'
        }
      });

      // Log HTTP response status and headers
      addLog(`HTTP Response Status: ${response.status}`);
      addLog('HTTP Response Headers: ' + JSON.stringify(response.headers));

      const transcriptText = response.data; // Axios handles the response parsing

      // Check for the transcript in the HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(transcriptText, 'text/html');
      const transcriptElement = doc.querySelector('.Grid__cell.flx-s:1') || doc.querySelector('.talk-transcript__paragraph');

      if (!transcriptElement) {
        throw new Error('Transcript element not found in the HTML.');
      }

      const text = transcriptElement.textContent || '';
      addLog('Transcript Text: ' + text);
      return text; // Return the scraped transcript
    } catch (err) {
      addLog("Error during transcript scraping.");
      if (axios.isAxiosError(err)) {
        addLog(`Axios error: ${err.message}`);
        if (err.response) {
          addLog(`Error Response Status: ${err.response.status}`);
          addLog(`Error Response Body: ${err.response.data}`);
        }
      } else {
        addLog(`Network error: ${err.message}`);
      }
      addLog(`Attempted URL: ${transcriptUrl}`); // Log the exact URL being requested
      setError("Failed to scrape the transcript.");
      setErrorDetails(err.message); // Set error details
      throw err; // Re-throw the error for handling
    }
  };

  // Function to send the transcript to the chatbot
  const sendTranscriptToChatbot = async (transcriptText: string) => {
    addLog('Sending transcript to chatbot...');
    if (selectedTalk) {
      const formattedMessage = `🎙️ Transcript of "${selectedTalk.title}": ${transcriptText}`;
      addLog('Sending Message to Chatbot: ' + formattedMessage);
      try {
        await sendActionToChatbot(formattedMessage);
        addLog('Message Sent Successfully');
        setTranscriptSaved(true);
      } catch (err) {
        addLog("Failed to send message to chatbot.");
        setError("Failed to send the transcript to the chatbot.");
        setErrorDetails(err.message); // Set error details
      }
    } else {
      addLog("No selected talk available to send.");
    }
  };

  // Define the function to handle transcript scraping and sending
  const handleTranscript = useCallback(async () => {
    if (selectedTalk) {
      try {
        const transcriptText = await scrapeTranscript(selectedTalk.url);
        await sendTranscriptToChatbot(transcriptText);
      } catch (err) {
        addLog("Error in handling transcript process.");
      }
    }
  }, [selectedTalk]);

  // Define the search function
  const handleSearch = useCallback(async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSelectedTalk(null);
    setTranscriptSaved(false); // Reset save state on new search
    setErrorDetails(''); // Reset error details on new search

    addLog('Initiating Search...');
    try {
      const response = await axios.get(`http://localhost:8000/api/py/search?query=${encodeURIComponent(query)}`);
      if (!response.status === 200) {
        addLog(`Search failed. Status: ${response.status} - ${response.statusText}`);
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const data: Talk[] = response.data;
      setTalks(data);
      addLog('Search results retrieved: ' + data.length + ' talks found.');

      if (data.length > 0) {
        setSelectedTalk(data[0]);
        addLog('Selected Talk: ' + data[0].title);
      }
    } catch (err) {
      addLog("Failed to fetch search results.");
      setError("Failed to fetch search results. Please check if the backend server is running.");
      setErrorDetails(err.message); // Set error details
    } finally {
      setLoading(false);
    }
  }, [query, setTalks]);

  // Set the initial keyword when the component mounts
  useEffect(() => {
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword();
      setQuery(initialKeyword.current);
      setSearchInitiated(true);
      addLog(`Initial keyword set: ${initialKeyword.current}`);
    }
  }, []);

  // Run the search after setting the query
  useEffect(() => {
    if (searchInitiated) {
      handleSearch();
    }
  }, [searchInitiated, handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const generateEmbedUrl = useCallback((url: string): string => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}?subtitle=en` : url;
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
      addLog(`Opened transcript in a new tab: ${transcriptUrl}`);
    }
  };

  return (
    <div className={styles.middlePanel}>
      {/* Search Section */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Enter a keyword"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        {selectedTalk && (
          <>
            <button
              onClick={handleTranscript} // Call handleTranscript to separate logic
              className={`${styles.button} ${styles.chatButton}`}
            >
              Chat
            </button>
            <button
              onClick={openTranscriptInNewTab} // Open transcript URL in a new tab
              className={`${styles.button} ${styles.tedButton}`}
            >
              View Transcript
            </button>
            <button
              onClick={() => window.open(selectedTalk.url, '_blank')}
              className={`${styles.button} ${styles.tedButton}`}
            >
              Play in New Tab
            </button>
          </>
        )}
        {loading && (
          <div className={styles.loadingSpinner}>
            <Image src={SDGWheel} alt="Loading..." width={24} height={24} />
          </div>
        )}
      </div>

      {/* Now Playing Section */}
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={generateEmbedUrl(selectedTalk.url)}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
          />
          {transcriptSaved && <p className={styles.successMessage}>Transcript sent successfully!</p>}
        </div>
      )}

      {/* Search Results Section */}
      {searchInitiated && (
        <div className={styles.resultsContainer}>
          {talks.map((talk, index) => (
            <div key={index} className={styles.resultItem}>
              <h3>
                <a
                  href="#"
                  className={styles.resultLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTalk(talk);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {talk.title}
                </a>
                <p className={styles.sdgTags}>
                  {talk.sdg_tags.length > 0 ? talk.sdg_tags.join(', ') : ''}
                </p>
              </h3>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
      
      {/* Render Debug Panel */}
      <DebugPanel logs={logs} curlCommand="Example CURL Command" errorDetails={errorDetails} />
    </div>
  );
};

export default React.memo(MiddlePanel);
