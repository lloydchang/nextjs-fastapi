// components/SearchSection.tsx

'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import SDGWheel from '../public/SDGWheel.png';
import styles from '../styles/SearchSection.module.css';
import { useTalkContext } from '../context/TalkContext';
import { useChat } from '../hooks/useChat';

type Talk = {
  title: string;
  url: string;
  sdg_tags: string[];
};

interface SearchSectionProps {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => Promise<void>;
  loading: boolean;
  selectedTalk: Talk | null;
  setSelectedTalk: React.Dispatch<React.SetStateAction<Talk | null>>;
  talks: Talk[];
  onBotShare: () => void; // New prop for the bot share function
}

const SearchSection: React.FC<SearchSectionProps> = ({
  query,
  setQuery,
  handleSearch,
  loading,
  selectedTalk,
  setSelectedTalk,
  talks,
  onBotShare,
}) => {
  const { setTranscript } = useTalkContext(); // Get setTranscript from context
  const { sendActionToChatbot } = useChat(); // Get sendActionToChatbot from context

  const fetchTranscript = useCallback(async (url: string) => {
    const tedRegex = /https:\/\/www\.ted\.com\/talks\/([\w_]+)/; // Regex to extract the talk ID
    const match = url.match(tedRegex);
    
    if (match) {
      const transcriptUrl = `https://www.ted.com/talks/${match[1]}/transcript?subtitle=en`; // Construct the transcript URL
      
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
        
        setTranscript(transcriptText); // Set the transcript in context
        const formattedTranscript = `📜 ${transcriptText}`;
        sendActionToChatbot(formattedTranscript); // Send the formatted transcript to the chatbot
      } catch (error) {
        console.error("Failed to fetch transcript:", error);
      }
    }
  }, [setTranscript, sendActionToChatbot]);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          placeholder="Enter a keyword"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
        >
          {loading ? "Searching…" : "Search 🔍"}
        </button>
        <button 
          onClick={onBotShare}
          className={`${styles.button} ${styles.botButton}`} 
        >
          Bot 🤖
        </button>
        <button 
          onClick={() => {
            if (selectedTalk) {
              fetchTranscript(selectedTalk.url); // Fetch transcript for selected talk
              window.open(selectedTalk.url, '_blank');
            }
          }}
          className={`${styles.button} ${styles.tabButton}`} 
          disabled={!selectedTalk}
        >
          Tab 📑
        </button>
        {loading && (
          <div className={styles.loadingSpinner}>
            <Image src={SDGWheel} alt="Loading..." width={24} height={24} />
          </div>
        )}
      </div>

      {/* Now Playing Section - Moved here */}
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.split('/').pop()}`} // Generate embed URL
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
          />
        </div>
      )}

      {/* Search Results Section */}
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
    </div>
  );
};

export default SearchSection;
