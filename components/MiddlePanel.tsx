// components/MiddlePanel.tsx
'use client'; // Mark as a client component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from './MiddlePanel.module.css';

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const initialKeyword = useRef<string>("TED AI");

  const [query, setQuery] = useState<string>(initialKeyword.current);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<any>(null);

  // Handle search logic
  const handleSearch = useCallback(async () => {
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
          setSelectedTalk(data[0]);
        }
      } else {
        setError("Unexpected response format.");
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
  }, [searchInitiated, handleSearch]); // Add `handleSearch` as a dependency

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className={styles.middlePanel}>
      {/* Search Container */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Enter a keyword"
          value={query}
          onChange={handleInputChange}
          className={styles.searchInput}
        />
        <button onClick={handleSearch} className={`${styles.button} ${styles.searchButton}`} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default MiddlePanel;
