// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';

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
  const initialKeyword = useRef<string>("TED AI");

  const [query, setQuery] = useState<string>(initialKeyword.current);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  // Function to determine the initial keyword based on randomization
  const determineInitialKeyword = () => {
    const randomNumber = Math.floor(Math.random() * 18); // Generate a random number between 0 and 17
    return randomNumber === 0 
      ? "TED AI" 
      : sdgKeywords[Math.floor(Math.random() * sdgKeywords.length)];
  };

  // Define the search function
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError("Please enter a keyword to search."); // Show error if query is empty
      return;
    }

    setError(null);
    setTalks([]);
    setLoading(true);
    setSelectedTalk(null);

    try {
      const response = await fetch(`http://localhost:8000/api/py/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const data: Talk[] = await response.json();
      setTalks(data);
      if (data.length > 0) {
        setSelectedTalk(data[0]);
      }
    } catch (err) {
      setError("Failed to fetch search results. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, [query, setTalks]);

  // Set the initial keyword when the component mounts
  useEffect(() => {
    initialKeyword.current = determineInitialKeyword(); // Determine the initial keyword
    setQuery(initialKeyword.current); // Update the query state
    setSearchInitiated(true); // Trigger search
  }, []);

  // Run the search after setting the query
  useEffect(() => {
    if (searchInitiated) {
      handleSearch(); // Run the search
    }
  }, [searchInitiated, handleSearch]); // Depend on searchInitiated and handleSearch

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
          <button
            onClick={() => window.open(selectedTalk.url, '_blank')}
            className={`${styles.button} ${styles.tedButton}`}
          >
            Play in New Tab
          </button>
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
    </div>
  );
};

export default React.memo(MiddlePanel);
