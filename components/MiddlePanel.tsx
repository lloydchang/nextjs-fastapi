// components/MiddlePanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/MiddlePanel.module.css';
import { useChat } from '../hooks/useChat'; // Import useChat to send messages to the chatbot

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
  const { talks, setTalks, setTranscript } = useTalkContext(); // Get setTranscript from context
  const { sendActionToChatbot } = useChat(); // Use sendActionToChatbot from the useChat hook
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

  // Fetch transcript for the selected talk
  const fetchTranscript = useCallback(async (url: string) => {
    const transcriptUrl = url.replace('/talks/', '/talks/') + '/transcript?subtitle=en';
    
    try {
      const response = await fetch(transcriptUrl);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const transcriptData = await response.text();
      // Extract the transcript text from the HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(transcriptData, 'text/html');
      const transcriptText = Array.from(doc.querySelectorAll('.Grid--withGutter .Grid-cell'))
        .map((element) => element.textContent)
        .join('\n');
      
      // Set the transcript in the context
      setTranscript(transcriptText); // Use context setter
      // Optionally, send the transcript to the chatbot
      const formattedTranscript = `📜 ${transcriptText}`;
      sendActionToChatbot(formattedTranscript); // Send the prefixed transcript to the chatbot
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
    }
  }, [setTranscript, sendActionToChatbot]);

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
  }, [searchInitiated, handleSearch]);

  // Fetch the transcript when the selected talk changes
  useEffect(() => {
    if (selectedTalk) {
      fetchTranscript(selectedTalk.url); // Fetch transcript for the selected talk
    }
  }, [selectedTalk, fetchTranscript]);

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
