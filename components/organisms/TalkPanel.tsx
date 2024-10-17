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

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isSearchInProgress = useRef(false);
  const initialRender = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const sentMessagesRef = useRef<Set<string>>(new Set());

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search function to avoid excessive API calls
  const debouncedPerformSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    []
  );

  // Perform search on component mount
  useEffect(() => {
    console.log('[TalkPanel] Component mounted.');
    if (initialRender.current) {
      console.log('[TalkPanel] Performing initial search.');
      performSearch(searchQuery);
      initialRender.current = false;
    }

    return () => {
      console.log('[TalkPanel] Component unmounted. Aborting any ongoing search.');
      abortControllerRef.current?.abort();
      debouncedPerformSearch.cancel();
    };
  }, []);

  // Perform the search logic with error handling
  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    console.log(`[performSearch] Query: ${trimmedQuery}`);

    if (isSearchInProgress.current || trimmedQuery === lastQueryRef.current) {
      console.log('[performSearch] Duplicate or ongoing search detected. Skipping.');
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery;
    dispatch(setLoading(true));
    dispatch(setApiError(null));

    try {
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.status !== 200) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));

      console.log('[performSearch] Search results:', data);
      handleSearchResults(data);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('[performSearch] Search request canceled.');
      } else {
        console.error('[performSearch] Error fetching talks:', error.message);
        dispatch(setApiError('Failed to fetch talks. Please try again.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  // Handle search results by filtering unique talks and setting state
  const handleSearchResults = (data: Talk[]) => {
    console.log('[handleSearchResults] Received data:', data);

    const uniqueTalks = shuffleArray(data).filter(
      (newTalk) => !talks.some((existingTalk) => existingTalk.url === newTalk.url)
    );

    console.log('[handleSearchResults] Filtered unique talks:', uniqueTalks);
    dispatch(setTalks(uniqueTalks));

    if (uniqueTalks.length > 0) {
      console.log(`[handleSearchResults] Selecting first talk: ${uniqueTalks[0].title}`);
      dispatch(setSelectedTalk(uniqueTalks[0]));
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(uniqueTalks));
  };

  // Open the transcript of the selected talk in a new tab
  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      console.log(`[openTranscriptInNewTab] Opening transcript for: ${selectedTalk.title}`);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    } else {
      console.warn('[openTranscriptInNewTab] No talk selected.');
    }
  };

  // Shuffle the current talks and update the state
  const shuffleTalks = () => {
    console.log('[shuffleTalks] Shuffling talks.');
    const shuffledTalks = shuffleArray(talks);
    console.log('[shuffleTalks] Shuffled talks:', shuffledTalks);
    dispatch(setTalks(shuffledTalks));
  };

  return (
    <div className={styles.TalkPanel}>
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={selectedTalk.title}
            onError={() => console.error('[iframe] Failed to load the TED iframe.')}
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

        <button onClick={shuffleTalks} className={`${styles.button} ${styles.shuffleButton}`}>
          Shuffle
        </button>

        {selectedTalk && (
          <button onClick={openTranscriptInNewTab} className={`${styles.button} ${styles.tedButton}`}>
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
