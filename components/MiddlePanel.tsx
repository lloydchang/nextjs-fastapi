// src/components/MiddlePanel.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png'; // Import SDG Wheel for search loading indicator
import styles from './MiddlePanel.module.css';

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const initialKeyword = useRef<string>("TED AI"); // Fixed initial keyword

  const [query, setQuery] = useState<string>(initialKeyword.current);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<any>(null);

  useEffect(() => {
    handleSearch(); // Trigger search on initial render
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSearchInitiated(true);
    setSelectedTalk(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/py/search?query=${query}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setTalks(data);
        if (data.length > 0) {
          setSelectedTalk(data[0]); // Automatically set the first talk as "Now Playing"
        }
      } else {
        setError("Unexpected response format.");
      }
    } catch (err) {
      setError("Failed to fetch search results. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedUrl = (url: string) => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}` : url;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
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
        <button onClick={handleSearch} className={`${styles.button} ${styles.searchButton}`}>
          Search
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
          {talks.length > 0 ? (
            talks.map((talk, index) => (
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
                </h3>
              </div>
            ))
          ) : (
            <p>No results found.</p>
          )}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default MiddlePanel;
