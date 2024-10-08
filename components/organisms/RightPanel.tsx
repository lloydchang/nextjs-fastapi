// File: components/organisms/RightPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTalkContext } from '../state/context/TalkContext';
import Image from 'next/image';
import SDGWheel from '../../public/images/SDGWheel.png';
import styles from '../../styles/components/organisms/RightPanel.module.css';
import { useChatContext } from '../state/context/ChatContext';
import axios from 'axios';
import { Talk } from '../state/types'; // Use shared Talk type from centralized types file

const sdgTitleMap: Record<string, string> = {
  'sdg1': 'SDG 1: No Poverty',
  'sdg2': 'SDG 2: Zero Hunger',
  'sdg3': 'SDG 3: Good Health and Well-Being',
  'sdg4': 'SDG 4: Quality Education',
  'sdg5': 'SDG 5: Gender Equality',
  'sdg6': 'SDG 6: Clean Water and Sanitation',
  'sdg7': 'SDG 7: Affordable and Clean Energy',
  'sdg8': 'SDG 8: Decent Work and Economic Growth',
  'sdg9': 'SDG 9: Industry, Innovation, and Infrastructure',
  'sdg10': 'SDG 10: Reduced Inequalities',
  'sdg11': 'SDG 11: Sustainable Cities and Communities',
  'sdg12': 'SDG 12: Responsible Consumption and Production',
  'sdg13': 'SDG 13: Climate Action',
  'sdg14': 'SDG 14: Life Below Water',
  'sdg15': 'SDG 15: Life on Land',
  'sdg16': 'SDG 16: Peace, Justice, and Strong Institutions',
  'sdg17': 'SDG 17: Partnerships for the Goals'
};

const determineInitialKeyword = () => {
  const randomNumber = Math.floor(Math.random() * 18);
  return randomNumber === 0 
    ? "TED AI" 
    : ['poverty', 'hunger', 'health', 'education', 'gender', 'water', 'energy', 'work', 'industry', 'inequality', 'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'][randomNumber - 1];
};

const RightPanel: React.FC = () => {
  const { talks, setTalks } = useTalkContext();
  const { sendActionToChatbot } = useChatContext();
  const initialKeyword = useRef<string>("");
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null); // Reference for RightPanel
  const listRef = useRef<HTMLDivElement | null>(null);  // Reference for ResultsList

  useEffect(() => {
    if (initialKeyword.current === "") {
      initialKeyword.current = determineInitialKeyword();
      setQuery(initialKeyword.current);
      performSearch(initialKeyword.current);
    }
  }, []);

  const performSearch = (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(searchQuery)}`)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const responseData = response.data;

        if (responseData.results && Array.isArray(responseData.results)) {
          const data: Talk[] = responseData.results.map((result: any) => ({
            title: result.slug.replace(/_/g, ' '),
            url: `https://www.ted.com/talks/${result.slug}`,
            sdg_tags: result.sdg_tags || []
          }));

          setTalks(data);

          if (data.length > 0) {
            setSelectedTalk(data[0]);
          } else {
            setSelectedTalk(null);
          }
        } else {
          setTalks([]);
          setSelectedTalk(null);
          setError("No results found.");
        }
      })
      .catch(() => {
        setError("Failed to fetch talks.");
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
      performSearch(query);
    }
  }, [query]);

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
    }
  };

  return (
    <div ref={panelRef} className={`${styles.rightPanel} ${styles['right-panel']}`}>
      <div className={styles.searchContainer}>
        <div className={styles.searchRowContainer}>
          <input
            type="text"
            placeholder="Enter a keyword"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={() => performSearch(query)} className={`${styles.button} ${styles.searchButton}`} disabled={loading}>
            Search
          </button>
          {selectedTalk && (
            <button onClick={openTranscriptInNewTab} className={`${styles.button} ${styles.tedButton}`}>
              Transcript
            </button>
          )}
        </div>
        {loading && (
          <div className={styles.loadingSpinnerContainer}>
            <Image src={SDGWheel} alt="Loading..." width={24} height={24} className={styles.loadingSpinner} />
          </div>
        )}
      </div>

      {error && <div className={styles.errorContainer}><p className={styles.errorText}>{error}</p></div>}

      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`} width="100%" height="400px" allow="autoplay; fullscreen; encrypted-media" className={styles.videoFrame} />
        </div>
      )}

      {talks.length > 0 && (
        <div ref={listRef} className={styles.scrollableContainer}>
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <div 
                key={index} 
                className={styles.resultItem} 
                onClick={() => {
                  setSelectedTalk(talk);
                  if (panelRef.current) panelRef.current.scrollTop = 0; // Scroll RightPanel to top only
                  // Removed the scroll for listRef
                }}>
                <h3>
                  <a href="#" className={styles.resultLink}>{talk.title}</a>
                  <p className={styles.sdgTags}>{talk.sdg_tags.map(tag => sdgTitleMap[tag]).join(', ')}</p>
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RightPanel);
