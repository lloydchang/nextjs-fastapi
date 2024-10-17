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
import { sdgTitleMap } from 'components/constants/sdgTitles';

// Helper functions...

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { isLoading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const isSearchInProgress = useRef(false);
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    []
  );

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      performSearch(searchQuery);
    }

    return () => {
      abortControllerRef.current?.abort();
      debouncedPerformSearch.cancel();
    };
  }, [searchQuery, performSearch, debouncedPerformSearch]);

  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    debugLog(`Performing search with query: "${trimmedQuery}"`);

    if (isSearchInProgress.current || trimmedQuery === lastQueryRef.current) {
      debugLog('Search already in progress or query has not changed. Exiting.');
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery;

    debugLog('Dispatching loading state.');
    dispatch(setLoading(true));
    dispatch(setApiError(null));

    try {
      debugLog(`Making API request to fetch talks with query: "${trimmedQuery}"`);
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.status !== 200) throw new Error(response.statusText);
      debugLog(`Search successful: ${response.data.results.length} results received.`);

      const data: Talk[] = response.data.results.map((result: any) => ({
        presenterDisplayName: result.document.presenterDisplayName || '',
        title: result.document.slug.replace(/_/g, ' ') || '',
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || '',
      }));

      handleSearchResults(data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('[performSearch] Error fetching talks:', error);
        dispatch(setApiError('Error fetching talks.'));
      }
    } finally {
      debugLog('Setting loading to false.');
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  }, [dispatch]);

  const handleSearchResults = useCallback((data: Talk[]) => {
    debugLog(`Handling search results: ${data.length} talks received.`);
    dispatch(setTalks(data));

    if (data.length > 0) {
      const firstTalk = data[0];
      dispatch(setSelectedTalk(firstTalk));
      sendTranscriptAsMessage(firstTalk);
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(data));
  }, [dispatch]);

  const sendTranscriptAsMessage = useCallback(async (talk: Talk) => {
    if (sentMessagesRef.current.has(talk.title)) {
      debugLog(`Message for talk "${talk.title}" already sent, skipping.`);
      return;
    }

    sentMessagesRef.current.add(talk.title);
    debugLog(`Sending transcript for talk: ${talk.title}`);

    const messageParts = [
      `${talk.transcript} —— ${talk.title}\n\n${getSdgTitles(talk.sdg_tags).join(', ')}`,
    ];

    for (const part of messageParts) {
      dispatch(sendMessage({
        persona: `${talk.presenterDisplayName}`,
        role: 'bot',
        sender: 'bot',
        text: part,
        hidden: false,
      }));
      debugLog(`Sent message part: ${part}`);
    }
  }, [dispatch]);

  const openTranscriptInNewTab = useCallback(() => {
    if (selectedTalk) {
      debugLog(`Opening transcript for: ${selectedTalk.title}`);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  }, [selectedTalk]);

  const shuffleTalks = useCallback(() => {
    debugLog('Shuffling talks.');
    dispatch(setTalks(shuffleArray(talks)));
  }, [dispatch, talks]);

  return (
    <div className={styles.TalkPanel}>
      {isLoading && <LoadingSpinner />}

      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={selectedTalk.title}
            onError={() => console.error('Failed to load iframe')}
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              debugLog(`Search query updated: "${e.target.value}"`);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                debugLog(`Search initiated via Enter key with query: "${searchQuery}"`);
                performSearch(searchQuery);
              }
            }}
            className={styles.searchInput}
            placeholder="Search for talks..."
          />
          {isLoading && <LoadingSpinner />}
        </div>
        <button
          onClick={() => {
            debugLog(`Search button clicked with query: "${searchQuery}"`);
            performSearch(searchQuery);
          }}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={isLoading}
        >
          Search
        </button>
        <button onClick={shuffleTalks} className={`${styles.button} ${styles.shuffleButton}`}>
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
          <TalkItem key={`${talk.url}-${index}`} talk={talk} selected={selectedTalk?.title === talk.title} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
