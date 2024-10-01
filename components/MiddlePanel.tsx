// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';
import { useChatContext } from '../context/ChatContext';
import DebugPanel from './DebugPanel';

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

  // Helper function to add logs
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // Function to determine the initial keyword based on randomization
  const determineInitialKeyword = () => {
    const randomIndex = Math.floor(Math.random() * sdgKeywords.length);
    return sdgKeywords[randomIndex];
  };

  // Function to scrape and send the transcript to the chatbot
  const scrapeAndSendTranscript = useCallback(async () => {
    addLog('Clicked Chat Button');
    if (selectedTalk) {
      addLog(`Selected Talk: ${selectedTalk.title}`);
      try {
        const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
        addLog(`Fetching transcript from: ${transcriptUrl}`);
        const response = await fetch(transcriptUrl, { headers: { 'Content-Type': 'text/html' } });
        if (!response.ok) {
          throw new Error(`Failed to fetch transcript from ${transcriptUrl}`);
        }

        const responseText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseText, 'text/html');
        const transcriptElement = doc.querySelector('.Grid__cell.flx-s:1');
        const transcriptText = transcriptElement ? transcriptElement.textContent || '' : 'No transcript available.';

        addLog('Transcript Text: ' + transcriptText);

        // Send the scraped transcript directly to the chatbot as a new message
        const formattedMessage = `🎙️ Transcript of "${selectedTalk.title}": ${transcriptText}`;
        addLog('Sending Message to Chatbot: ' + formattedMessage);
        await sendActionToChatbot(formattedMessage);
        addLog('Message Sent Successfully');

        setTranscriptSaved(true);
      } catch (err) {
        addLog("Failed to scrape and send the transcript.");
        setError("Failed to scrape and send the transcript.");
      }
    } else {
      addLog("No selected talk available to send.");
    }
  }, [selectedTalk, sendActionToChatbot]);

  // Define the search function
  const handleSearch = useCallback(async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSelectedTalk(null);
    setTranscriptSaved(false); // Reset save state on new search

    addLog('Initiating Search...');
    try {
      const response = await fetch(`http://localhost:8000/api/py/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const data: Talk[] = await response.json();
      setTalks(data);
      addLog('Search results retrieved: ' + data.length + ' talks found.');

      if (data.length > 0) {
        setSelectedTalk(data[0]);
        addLog('Selected Talk: ' + data[0].title);
      }
    } catch (err) {
      addLog("Failed to fetch search results.");
      setError("Failed to fetch search results. Please check if the backend server is running.");
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
              onClick={scrapeAndSendTranscript}
              className={`${styles.button} ${styles.chatButton}`}
            >
              Chat
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
      <DebugPanel logs={logs} />
    </div>
  );
};

export default React.memo(MiddlePanel);
