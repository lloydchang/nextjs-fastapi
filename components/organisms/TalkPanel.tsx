// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import SDGWheel from 'public/images/SDGWheel.png';
import styles from 'styles/components/organisms/TalkPanel.module.css';
import axios from 'axios';
import { RootState } from 'store/store'; // Import RootState
import { setTalks, setSelectedTalk, addSearchHistory, setError, setLoading } from 'store/talkSlice'; // Import necessary actions
import { Talk } from 'components/state/types'; // Use shared Talk type from centralized types file

const sdgTitleMap: Record<string, string> = {
  sdg1: 'SDG 1: No Poverty',
  sdg2: 'SDG 2: Zero Hunger',
  sdg3: 'SDG 3: Good Health and Well-Being',
  sdg4: 'SDG 4: Quality Education',
  sdg5: 'SDG 5: Gender Equality',
  sdg6: 'SDG 6: Clean Water and Sanitation',
  sdg7: 'SDG 7: Affordable and Clean Energy',
  sdg8: 'SDG 8: Decent Work and Economic Growth',
  sdg9: 'SDG 9: Industry, Innovation, and Infrastructure',
  sdg10: 'SDG 10: Reduced Inequalities',
  sdg11: 'SDG 11: Sustainable Cities and Communities',
  sdg12: 'SDG 12: Responsible Consumption and Production',
  sdg13: 'SDG 13: Climate Action',
  sdg14: 'SDG 14: Life Below Water',
  sdg15: 'SDG 15: Life on Land',
  sdg16: 'SDG 16: Peace, Justice, and Strong Institutions',
  sdg17: 'SDG 17: Partnerships for the Goals',
};

const determineInitialKeyword = () => {
  const keywords = [
    'poverty', 'hunger', 'health', 'education', 'gender',
    'water', 'energy', 'work', 'industry', 'inequality',
    'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'
  ];
  const randomIndex = Math.floor(Math.random() * keywords.length);
  return keywords[randomIndex];
};

// Fisher-Yates shuffle function
const shuffleArray = <T,>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Get a random index
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
};

const TalkPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { talks, selectedTalk, searchHistory, error, loading } = useSelector((state: RootState) => state.talk); // Get state from Redux

  useEffect(() => {
    const initialKeyword = determineInitialKeyword();
    performSearch(initialKeyword);
  }, []);

  const performSearch = async (searchQuery: string) => {
    dispatch(setError(null)); // Reset error
    dispatch(setLoading(true)); // Set loading state

    try {
      const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.slug}`,
        sdg_tags: result.sdg_tags || [],
      }));

      dispatch(setTalks(data)); // Set talks in Redux
      dispatch(setSelectedTalk(data[0] || null)); // Set selected talk
      dispatch(addSearchHistory(searchQuery)); // Add to search history
    } catch (error) {
      dispatch(setError("Failed to fetch talks.")); // Set error message
    } finally {
      dispatch(setLoading(false)); // Reset loading state
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update input value as needed, if you're planning to use it
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(e.currentTarget.value); // Use the input value directly
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
    }
  };

  return (
    <div className={`${styles.TalkPanel}`}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search talks…"
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className={styles.searchInput}
        />
        <button onClick={() => performSearch("")} className={`${styles.button} ${styles.searchButton}`} disabled={loading}>
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

      {error && <div className={styles.errorContainer}><p className={styles.errorText}>{error}</p></div>}

      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`} width="100%" height="400px" allow="autoplay; fullscreen; encrypted-media" />
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
                  dispatch(setSelectedTalk(talk)); // Set selected talk in Redux
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

      {searchHistory.length > 0 && (
        <div className={styles.historyContainer}>
          <h4>Search History</h4>
          <ul>
            {searchHistory.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
