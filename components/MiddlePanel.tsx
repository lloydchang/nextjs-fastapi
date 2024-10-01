// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import { useChat } from '../hooks/useChat';
import SearchSection from './SearchSection';
import NowPlayingSection from './NowPlayingSection';
import styles from '../styles/MiddlePanel.module.css';

// TypeScript Types
type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

const MiddlePanel: React.FC = () => {
  const { talks, setTalks, setTranscript } = useTalkContext();
  const { sendActionToChatbot } = useChat();
  const initialKeyword = useRef<string>("TED AI");

  const [query, setQuery] = useState<string>(initialKeyword.current);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInitiated, setSearchInitiated] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const determineInitialKeyword = () => {
    const randomNumber = Math.floor(Math.random() * 18);
    return randomNumber === 0 
      ? "TED AI" 
      : ['poverty', 'hunger', 'health', 'education', 'gender', 'water', 'energy', 'work', 'industry', 'inequality', 'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'][Math.floor(Math.random() * 16)];
  };

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

  const fetchTranscript = useCallback(async (url: string) => {
    const transcriptUrl = url.replace('/talks/', '/talks/') + '/transcript?subtitle=en';
    
    try {
      const response = await fetch(transcriptUrl);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const transcriptData = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(transcriptData, 'text/html');
      const transcriptText = Array.from(doc.querySelectorAll('.Grid--withGutter .Grid-cell'))
        .map((element) => element.textContent)
        .join('\n');
      
      setTranscript(transcriptText);
      const formattedTranscript = `📜 ${transcriptText}`;
      sendActionToChatbot(formattedTranscript);
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
    }
  }, [setTranscript, sendActionToChatbot]);

  useEffect(() => {
    initialKeyword.current = determineInitialKeyword();
    setQuery(initialKeyword.current);
    setSearchInitiated(true);
  }, []);

  useEffect(() => {
    if (searchInitiated) {
      handleSearch();
    }
  }, [searchInitiated, handleSearch]);

  useEffect(() => {
    if (selectedTalk) {
      fetchTranscript(selectedTalk.url);
    }
  }, [selectedTalk, fetchTranscript]);

  const generateEmbedUrl = useCallback((url: string): string => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/;
    const match = url.match(tedRegex);
    return match ? `https://embed.ted.com/talks/${match[1]}` : url;
  }, []);

  return (
    <div className={styles.middlePanel}>
      <NowPlayingSection
        selectedTalk={selectedTalk}
        generateEmbedUrl={generateEmbedUrl}
      />
      <SearchSection
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        loading={loading}
        selectedTalk={selectedTalk}
        setSelectedTalk={setSelectedTalk}
        talks={talks}
      />
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default React.memo(MiddlePanel);
