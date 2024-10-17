// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { Talk } from 'types';
import { shuffleArray } from 'components/utils/talkPanelUtils';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from 'lodash';
import styles from 'styles/components/organisms/TalkPanel.module.css';
import { performSearch } from 'components/utils/apiUtils'; // Import search logic

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState('');
  const isSearchInProgress = useRef(false); 
  const hasSearchedOnce = useRef(false); // Track if search has already executed
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input to prevent unnecessary API calls
  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      dispatch(performSearch(query));
    }, 500),
    [dispatch]
  );

  // Prevent double execution of initial search in Strict Mode
  useEffect(() => {
    if (!hasSearchedOnce.current) {
      console.log('Component mounted. Performing initial search...');
      debouncedPerformSearch(searchQuery);
      hasSearchedOnce.current = true; // Ensure the search only runs once
    }

    return () => {
      debouncedPerformSearch.cancel();
    };
  }, [searchQuery, debouncedPerformSearch]);

  const handleSearchResults = (data: Talk[]) => {
    console.log('Handling search results:', data);
    const uniqueTalks = shuffleArray(data).filter(
      (newTalk) => !talks.some((existingTalk) => existingTalk.url === newTalk.url)
    );

    dispatch(setTalks(uniqueTalks));
    if (uniqueTalks.length > 0) dispatch(setSelectedTalk(uniqueTalks[0]));
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  return (
    <div className={styles.TalkPanel}>
      {selectedTalk && (
        <iframe
          src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
          width="100%"
          height="400"
          allow="autoplay; fullscreen; encrypted-media"
        />
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && debouncedPerformSearch(searchQuery)}
        />
        {loading && <LoadingSpinner />}
      </div>

      {error && <div>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk, index) => (
          <TalkItem
            key={`${talk.url}-${index}`}
            talk={talk}
            selected={selectedTalk?.title === talk.title}
          />
        ))}
      </div>

      {selectedTalk && (
        <button onClick={openTranscriptInNewTab}>View Transcript</button>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
