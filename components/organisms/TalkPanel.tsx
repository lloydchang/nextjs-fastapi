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

const debugLog = (message: string) => console.debug(`[TalkPanel] ${message}`);

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { isLoading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isStrictMode = useRef(false);
  const mountCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const isSearchInProgress = useRef(false);
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    []
  );

  useEffect(() => {
    mountCounter.current += 1;
    isStrictMode.current = mountCounter.current === 1;

    if (!isStrictMode.current) {
      debugLog('Performing search after re-mount.');
      performSearch(searchQuery);
    }

    return () => {
      if (!isStrictMode.current) abortControllerRef.current?.abort();
      debouncedPerformSearch.cancel();
    };
  }, []);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (isSearchInProgress.current || trimmedQuery === lastQueryRef.current) return;

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

      const data: Talk[] = response.data.results.map((result: any) => ({
        presenterDisplayName: result.document.presenterDisplayName || '',
        title: result.document.slug.replace(/_/g, ' ') || '',
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || '',
      }));

      handleSearchResults(data);
    } catch (error) {
      if (!axios.isCancel(error)) dispatch(setApiError('Error fetching talks.'));
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  const handleSearchResults = (data: Talk[]) => {
    dispatch(setTalks(data));
    if (data.length) {
      dispatch(setSelectedTalk(data[0]));
      sendTranscriptAsMessage(data[0]);
    }
    localStorageUtil.setItem('lastSearchData', JSON.stringify(data));
  };

  const sendTranscriptAsMessage = async (talk: Talk) => {
    if (sentMessagesRef.current.has(talk.title)) return;
    sentMessagesRef.current.add(talk.title);

    const messageParts = [
      `Presenter: ${talk.presenterDisplayName}`,
      `Talk: ${talk.title}`,
      `URL: ${talk.url}`,
      `SDG Tags: ${talk.sdg_tags.join(', ')}`,
      `Transcript: ${talk.transcript}`,
    ];

    messageParts.forEach((part) => dispatch(sendMessage({ text: part, hidden: false })));
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  const shuffleTalks = () => dispatch(setTalks(shuffleArray(talks)));

  return (
    <div className={styles.TalkPanel}>
      {isLoading && <LoadingSpinner />}

      {!isStrictMode.current && selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={selectedTalk.title}
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
          {isLoading && <LoadingSpinner />}
        </div>
        <button onClick={() => performSearch(searchQuery)} disabled={isLoading}>
          Search
        </button>
        <button onClick={shuffleTalks}>Shuffle</button>
        {selectedTalk && (
          <button onClick={openTranscriptInNewTab}>Transcript</button>
        )}
      </div>

      {error && <div className={styles.errorContainer}>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk, index) => (
          <TalkItem key={`${talk.url}-${index}`} talk={talk} selected={talk.title === selectedTalk?.title} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
