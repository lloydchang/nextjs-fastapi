// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { determineInitialKeyword, shuffleArray } from 'components/utils/talkPanelUtils';
import { localStorageUtil } from 'components/utils/localStorage';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from 'lodash';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState<string>(determineInitialKeyword());

  const isSearchInProgress = useRef(false);
  const hasSearchedOnce = useRef(false); 
  const lastQueryRef = useRef<string>(''); 
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  const sentMessagesRef = useRef<Set<string>>(new Set());

  const logState = () => {
    console.log('Redux State:', { talks, selectedTalk, loading, error });
  };

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      console.log(`Debounced search initiated: ${query}`);
      performSearch(query);
    }, 500),
    []
  );

  useEffect(() => {
    console.log('Component mounted. Initializing search...');
    logState();

    if (!hasSearchedOnce.current) {
      console.log('Performing initial search...');
      performSearch(searchQuery);
      hasSearchedOnce.current = true;
    }

    return () => {
      console.log('Cleaning up tasks on unmount...');
      abortControllerRef.current?.abort();
      debouncedPerformSearch.cancel();
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    console.log(`Performing search with query: ${query}`);
    const trimmedQuery = query.trim().toLowerCase();
  
    if (isSearchInProgress.current && trimmedQuery === lastQueryRef.current) {
      console.log(`Skipping duplicate search for query: ${trimmedQuery}`);
      return;
    }
  
    // Abort the previous search and clear the controller to release memory.
    if (abortControllerRef.current) {
      console.log('Aborting previous search...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null; // Clear reference to avoid leaks
    }
  
    const controller = new AbortController();
    abortControllerRef.current = controller;
  
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery;
    dispatch(setApiError(null));
    dispatch(setLoading(true));
  
    try {
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(trimmedQuery)}`,
        { signal: controller.signal }
      );
  
      if (response.status !== 200) throw new Error(response.statusText);
  
      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));
  
      console.log('Search response data:', data);
      handleSearchResults(trimmedQuery, data);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Search aborted: Expected CanceledError'); // Suppress noisy logs
      } else {
        console.error('Error during search:', error);
        dispatch(setApiError('Error fetching talks.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
      console.log('Search completed.');
    }
  };

  const handleSearchResults = (query: string, data: Talk[]) => {
    console.log(`Handling search results for query: ${query}. Data:`, data);
    const processedData = shuffleArray(data);
    const uniqueTalks = processedData.filter(
      (newTalk) => !talks.some((existingTalk) => existingTalk.url === newTalk.url)
    );

    console.log('Unique talks after filtering:', uniqueTalks);
    dispatch(setTalks(uniqueTalks));

    if (!selectedTalk && uniqueTalks.length > 0) {
      dispatch(setSelectedTalk(uniqueTalks[0]));
      console.log('Selected first talk:', uniqueTalks[0]);
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(uniqueTalks));
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      console.log(`Opening transcript for ${selectedTalk.title}`);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  const shuffleTalks = () => {
    const shuffledTalks = shuffleArray(talks);
    console.log('Shuffled talks:', shuffledTalks);
    dispatch(setTalks(shuffledTalks));
  };

  return (
    <div className={styles.TalkPanel}>
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={`${selectedTalk.title} video`}
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
            className={styles.searchInput}
            placeholder="Search for talks..."
          />
          {loading && <LoadingSpinner />}
        </div>
        <button
          onClick={() => performSearch(searchQuery)}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
        >
          Search
        </button>
        <button
          onClick={shuffleTalks}
          className={`${styles.button} ${styles.shuffleButton}`}
        >
          Shuffle
        </button>
        {selectedTalk && (
          <button
            onClick={openTranscriptInNewTab}
            className={`${styles.button} ${styles.tedButton}`}
          >
            Transcript
          </button>
        )}
      </div>

      {error && <div className={styles.errorContainer}>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk, index) => (
          <TalkItem
            key={`${talk.url}-${index}`}
            talk={talk}
            selected={selectedTalk?.title === talk.title}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
