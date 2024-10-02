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
  const initialKeyword = useRef<string>(""); // No initial value
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [transcriptSaved, setTranscriptSaved] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]); // State to hold logs for DebugPanel
  const [errorDetails, setErrorDetails] = useState<string>(''); // State for error details
  const [transcriptStatus, setTranscriptStatus] = useState<string>(''); // Track transcript scraping status
  const [transcript, setTranscript] = useState<string>(''); // Store retrieved transcript

  // Helper function to add logs
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Update logs state
  };

  const determineInitialKeyword = () => {
    const randomIndex = Math.floor(Math.random() * sdgKeywords.length);
    return sdgKeywords[randomIndex];
  };

  const handleSearch = useCallback(async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSelectedTalk(null);
    setTranscriptSaved(false);
    setErrorDetails('');
    setTranscript('');
    setTranscriptStatus('');

    addLog('Initiating Search...');
    try {
      const response = await axios.get(`http://localhost:8000/api/py/search?query=${encodeURIComponent(query)}`);
      if (response.status !== 200) {
        addLog(`Search failed. Status: ${response.status} - ${response.statusText}`);
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      let data: Talk[] = response.data;
      data = data.sort(() => Math.random() - 0.5);

      setTalks(data);
      addLog('Search results retrieved: ' + data.length + ' talks found.');

      if (data.length > 0) {
        setSelectedTalk(data[0]);
        addLog('For example: ' + data[0].title);
      }
    } catch (err) {
      addLog("Failed to fetch search results.");
      setError("Failed to fetch search results. Please check if the backend server is running.");
      setErrorDetails(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, setTalks]);

  useEffect(() => {
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword();
      setQuery(initialKeyword.current);
      setSearchInitiated(true);
      addLog(`Initial keyword set: ${initialKeyword.current}`);
    }
  }, []);

  useEffect(() => {
    if (searchInitiated) {
      handleSearch();
    }
  }, [searchInitiated, handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const generateEmbedUrl = useCallback((url: string): string => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}?subtitle=en` : url;
  }, []);

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
              onClick={openTranscriptInNewTab} // Open transcript URL in a new tab
              className={`${styles.button} ${styles.tedButton}`}
            >
              Transcript
            </button>
          </>
        )}
        {loading && (
          <div className={styles.loadingSpinnerContainer}>
            <Image
              src={SDGWheel}
              alt="Loading..."
              width={24}
              height={24}
              className={styles.loadingSpinner}
            />
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
        </div>
      )}

      {/* Search Results Section */}
      {searchInitiated && (
        <div className={styles.scrollableContainer}>
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <div
                key={index}
                className={styles.resultItem}
                onClick={() => {
                  setSelectedTalk(talk);
                  setTranscript('');
                  setTranscriptStatus('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <h3>
                  <a href="#" className={styles.resultLink}>
                    {talk.title}
                  </a>
                  <p className={styles.sdgTags}>
                    {talk.sdg_tags.length > 0 ? talk.sdg_tags.join(', ') : ''}
                  </p>
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
      
      <DebugPanel logs={logs} curlCommand="Example CURL Command" errorDetails={errorDetails} />
    </div>
  );
};

export default React.memo(MiddlePanel);
