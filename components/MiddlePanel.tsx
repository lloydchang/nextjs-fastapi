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

type SdgMetadata = {
  sdg: string;
  description: string;
  target: string;
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
  const [loadingGreeting, setLoadingGreeting] = useState<boolean>(true); // Separate loading state for greeting
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true); // Separate loading state for metadata
  const [searchLoading, setSearchLoading] = useState<boolean>(false); // Separate loading state for search
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [greeting, setGreeting] = useState<string>(""); // Greeting will be set once fetched
  const [metadata, setMetadata] = useState<SdgMetadata[]>([]); // State for additional fetch

  // Fetch greeting from /api/py/hello
  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/py/hello');
        if (response.data && response.data.message) {
          setGreeting(response.data.message); // Use the `message` field from the response
        } else {
          setGreeting("Unknown response format");
        }
      } catch (error) {
        setGreeting("Failed to fetch greeting.");
      } finally {
        setLoadingGreeting(false); // Set loading state for greeting to false
      }
    };

    fetchGreeting();
  }, []);

  // Fetch SDG metadata from /api/py/sdg_metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/py/sdg_metadata');
        if (response.status === 200 && Array.isArray(response.data)) {
          setMetadata(response.data); // Set fetched SDG metadata
        } else {
          setMetadata([]);
        }
      } catch (error) {
        console.error("Failed to fetch SDG metadata:", error);
      } finally {
        setLoadingMetadata(false); // Set loading state for metadata to false
      }
    };

    fetchMetadata();
  }, []); // Independent fetch effect

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
    setSearchLoading(true);
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
      setErrorDetails(err.message);
    } finally {
      setSearchLoading(false);
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

  // Generate the embedded TED Talk URL
  const generateEmbedUrl = useCallback((url: string | undefined): string => {
    if (!url || typeof url !== "string") {
      return url ?? "";
    }

    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}?subtitle=en` : url;
  }, []);

  // Open the transcript for the selected TED talk
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
        <h1>{loadingGreeting ? "Fetching Greeting..." : greeting}</h1>
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
          disabled={searchLoading}
        >
          {searchLoading ? "Searching…" : "Search"}
        </button>
        <button
            onClick={openTranscriptInNewTab}
            className={`${styles.button} ${styles.tedButton}`}
          >
            Transcript
          </button>
      </div>

      {/* Now Playing Section for Selected TED Talk */}
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

      {/* SDG Metadata Section */}
      <div className={styles.sdgMetadata}>
        {loadingMetadata ? (
          <p>Fetching SDG Metadata...</p>
        ) : (
          <ul>
            {metadata.map((item, index) => (
              <li key={index}>
                <strong>{item.sdg}</strong>: {item.description} (Target: {item.target})
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchInitiated && (
        <div className={styles.resultsContainer}>
          {talks.map((talk, index) => (
            <div key={index} className={styles.resultItem}>
              <h3>{talk.title}</h3>
              <p>{talk.sdg_tags.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
      
      <DebugPanel logs={logs} curlCommand="Example CURL Command" errorDetails={errorDetails} />
    </div>
  );
};

export default React.memo(MiddlePanel);
