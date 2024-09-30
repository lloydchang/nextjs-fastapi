// components/MiddlePanel.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';
import dynamic from 'next/dynamic';

// If MiddlePanel is considered heavy, it can be lazy loaded in the main app
// But since this is the component itself, we'll optimize it

type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const initialKeyword = useRef<string>("TED AI");

  const [query, setQuery] = useState<string>(initialKeyword.current);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const handleSearch = useCallback(async () => {
    setError(null);
    setTalks([]);
    setLoading(true);
    setSearchInitiated(true);
    setSelectedTalk(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SEARCH_API_URL}?query=${encodeURIComponent(query)}`);
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

  useEffect(() => {
    if (!searchInitiated) {
      handleSearch();
    }
  }, [searchInitiated, handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const generateEmbedUrl = useCallback((url: string): string => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}` : url;
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
          aria-label={loading ? 'Searching' : 'Search'}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        {selectedTalk && (
          <button
            onClick={() => window.open(selectedTalk.url, '_blank')}
            className={`${styles.button} ${styles.tedButton}`}
            aria-label="Play in New Tab"
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
            title={selectedTalk.title}
            loading="lazy" // Lazy load the iframe
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

// Memoize MiddlePanel to prevent unnecessary re-renders
export default React.memo(MiddlePanel);
