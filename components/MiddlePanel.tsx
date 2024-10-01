// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import { useChat } from '../hooks/useChat';
import SearchSection from './SearchSection';
import styles from '../styles/MiddlePanel.module.css';

// TypeScript Types
type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

const MiddlePanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext(); // Get talks from context
  const { sendActionToChatbot } = useChat();

  const determineInitialKeyword = () => {
    const randomNumber = Math.floor(Math.random() * 18);
    return randomNumber === 0 
      ? "TED AI" 
      : ['poverty', 'hunger', 'health', 'education', 'gender', 'water', 'energy', 'work', 'industry', 'inequality', 'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'][Math.floor(Math.random() * 16)];
  };

  const [query, setQuery] = useState<string>(determineInitialKeyword()); // Set default query
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const handleSearch = useCallback(async () => {
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

  const handleBotShare = () => {
    // Logic for sharing the transcript can be managed in SearchSection
  };

  useEffect(() => {
    setSearchInitiated(true); // Start search initiation
  }, []);

  useEffect(() => {
    if (searchInitiated) {
      handleSearch(); // Perform search
    }
  }, [searchInitiated, handleSearch]);

  return (
    <div className={styles.middlePanel}>
      <SearchSection
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        loading={loading}
        selectedTalk={selectedTalk}
        setSelectedTalk={setSelectedTalk}
        talks={talks}
        onBotShare={handleBotShare} // Pass the bot share function to SearchSection
      />
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default React.memo(MiddlePanel);
