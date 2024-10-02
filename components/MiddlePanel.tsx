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
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [greeting, setGreeting] = useState<string>("");

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const determineInitialKeyword = () => {
    const randomIndex = Math.floor(Math.random() * sdgKeywords.length);
    return sdgKeywords[randomIndex];
  };

  // Initial greeting fetch
  useEffect(() => {
    const fetchGreeting = axios.get('http://127.0.0.1:8000/api/py/hello');
    fetchGreeting.then((greetingResponse) => {
      if (greetingResponse.data && greetingResponse.data.message) {
        setGreeting(greetingResponse.data.message);
      } else {
        setGreeting("Unknown response format");
      }
    }).catch((err) => {
      setGreeting("Failed to load greeting.");
      setErrorDetails(err.message);
      addLog("Failed to fetch greeting: " + err.message);
    });
  }, []);

  // Effect for handling the initial keyword setup and search
  useEffect(() => {
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword();
      setQuery(initialKeyword.current);
      performSearch(initialKeyword.current); // Trigger initial search
    }
  }, []);

  // Separate function for performing a search
  const performSearch = (searchQuery: string) => {
    setLoading(true);
    setError(null);

    axios.get(`http://localhost:8000/api/py/search?query=${encodeURIComponent(searchQuery)}`)
      .then((searchResponse) => {
        if (searchResponse.status !== 200) {
          addLog(`Search failed. Status: ${searchResponse.status} - ${searchResponse.statusText}`);
          throw new Error(`Error: ${searchResponse.status} - ${searchResponse.statusText}`);
        }

        let data: Talk[] = searchResponse.data;
        data = data.sort(() => Math.random() - 0.5);
        setTalks(data);
        addLog('Search results retrieved: ' + data.length + ' talks found.');

        if (data.length > 0) {
          setSelectedTalk(data[0]);
          addLog('For example: ' + data[0].title);
        } else {
          setSelectedTalk(null); // No talks found
        }
      })
      .catch((err) => {
        setError("Failed to fetch data. Please check if the backend server is running.");
        setErrorDetails(err.message);
        addLog("Failed to fetch data: " + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addLog(`Manual search initiated with keyword: ${query}`);
      performSearch(query); // Trigger search on Enter key
    }
  }, [query]);

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
      <div className={styles.searchContainer}>
        <div className={styles.greetingContainer}>
          <h1 className={styles.greetingText}>{greeting}</h1>
        </div>
        <div className={styles.searchRowContainer}>
          <input
            type="text"
            placeholder="Enter a keyword"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
          />
          <button
            onClick={() => {
              addLog(`Manual search initiated with keyword: ${query}`);
              performSearch(query);
            }}
            className={`${styles.button} ${styles.searchButton}`}
            disabled={loading}
          >
            {"Search"}
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
        </div>
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

      {talks.length > 0 && (
        <div className={styles.scrollableContainer}>
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <div
                key={index}
                className={styles.resultItem}
                onClick={() => {
                  setSelectedTalk(talk);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <h3>
                  <a href="#" className={styles.resultLink}>
                    {talk.title}
                  </a>
                  <p className={styles.sdgTags}>
                    {talk.sdg_tags && talk.sdg_tags.length > 0 ? talk.sdg_tags.join(', ') : ''}
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
