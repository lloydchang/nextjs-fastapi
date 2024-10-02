// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';
import { useChatContext } from '../context/ChatContext';
import DebugPanel from './DebugPanel';
import axios from 'axios';

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
  const [logs, setLogs] = useState<string[]>([]);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [greeting, setGreeting] = useState<string>("");

  // Fetch greeting and initial search results simultaneously
  useEffect(() => {
    const fetchGreetingAndSearch = async () => {
      try {
        const greetingPromise = axios.get('http://127.0.0.1:8000/api/py/hello');
        const keyword = initialKeyword.current || determineInitialKeyword();
        initialKeyword.current = keyword;

        // Fetch initial search results using a random keyword
        const searchPromise = axios.get(`http://127.0.0.1:8000/api/py/search?query=${encodeURIComponent(keyword)}`);

        const [greetingResponse, searchResponse] = await Promise.all([greetingPromise, searchPromise]);

        // Handle greeting response
        if (greetingResponse.data && greetingResponse.data.message) {
          setGreeting(greetingResponse.data.message);
        } else {
          setGreeting("Unknown response format");
        }

        // Handle search response
        if (searchResponse.data && Array.isArray(searchResponse.data)) {
          const data: Talk[] = searchResponse.data.sort(() => Math.random() - 0.5);
          setTalks(data);
          if (data.length > 0) {
            setSelectedTalk(data[0]);
            addLog(`Initial search results retrieved: ${data.length} talks found.`);
          }
        }
      } catch (error) {
        setGreeting("Failed to fetch greeting.");
        setError("Failed to fetch initial data. Please check if the backend server is running.");
        setErrorDetails((error as Error).message);
      }
    };

    fetchGreetingAndSearch();
  }, [setTalks]);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
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
    setErrorDetails('');

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
      setErrorDetails((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query, setTalks]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const generateEmbedUrl = useCallback((url: string | undefined): string => {
    if (!url || typeof url !== "string") {
      return url ?? "";
    }

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
        {/* Display the greeting message */}
        <h1>{greeting}</h1>
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
              onClick={openTranscriptInNewTab}
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
    </div>
  );
};

export default React.memo(MiddlePanel);
