// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { sendMessage } from 'store/chatSlice'; // Added to send transcript messages
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
  const isStrictModeMount = useRef(true); // Track Strict Mode remount
  const mountCounter = useRef(0); // Track the number of mounts
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const isSearchInProgress = useRef(false); // Track search status
  const sentMessagesRef = useRef<Set<string>>(new Set()); // Prevent duplicate messages

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search to prevent excessive API calls
  const debouncedPerformSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    []
  );

  useEffect(() => {
    mountCounter.current += 1;
    console.debug(`[TalkPanel] Mount count: ${mountCounter.current}`);

    if (mountCounter.current === 1) {
      console.debug('[TalkPanel] Initial Strict Mode mount detected. Skipping API call.');
      isStrictModeMount.current = true;
    } else {
      console.debug('[TalkPanel] Real mount. Performing initial search.');
      isStrictModeMount.current = false;
      performSearch(searchQuery);
    }

    return () => {
      console.debug('[TalkPanel] Component unmounted.');

      if (!isStrictModeMount.current) {
        console.debug('[TalkPanel] Aborting ongoing search due to real unmount.');
        abortControllerRef.current?.abort();
      }
      debouncedPerformSearch.cancel();
    };
  }, []);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    console.debug(`[performSearch] Query: ${trimmedQuery}`);

    if (isSearchInProgress.current || trimmedQuery === lastQueryRef.current) {
      console.debug('[performSearch] Skipping duplicate or ongoing search.');
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

      if (response.status !== 200) throw new Error(response.statusText);

      const data: Talk[] = response.data.results.map((result: any) => ({
        presenterDisplayName: result.document.presenterDisplayName || [],
        title: result.document.slug.replace(/_/g, ' ') || [],
        url: `https://www.ted.com/talks/${result.document.slug}` || [],
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || [],
      }));

      handleSearchResults(data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('[performSearch] Error fetching talks:', error);
        dispatch(setApiError('Error fetching talks.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  const handleSearchResults = (data: Talk[]) => {
    console.debug('[handleSearchResults] Received data:', data);

    const uniqueTalks = shuffleArray(data).filter(
      (talk) => !talks.some((existing) => existing.url === talk.url)
    );
    dispatch(setTalks(uniqueTalks));
    console.debug('[handleSearchResults] Unique talks dispatched:', uniqueTalks);

    if (uniqueTalks.length > 0) {
      const firstTalk = uniqueTalks[0];
      console.debug('[handleSearchResults] Selecting first talk:', firstTalk);
      dispatch(setSelectedTalk(firstTalk));
      sendTranscriptAsMessage(firstTalk); // Send transcript on selection
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(uniqueTalks));
  };

  const sendTranscriptAsMessage = async (talk: Talk) => {
    if (sentMessagesRef.current.has(talk.title)) {
      console.debug(`[sendTranscriptAsMessage] Skipping duplicate message for: ${talk.title}`);
      return;
    }

    console.debug(`[sendTranscriptAsMessage] Sending transcript for: ${talk.title}`);
    sentMessagesRef.current.add(talk.title); // Track sent messages

    const messageParts = [
      `Presenter: ${talk.presenterDisplayName}` || '',
      `Talk: ${talk.title}` || '',
      `URL: ${talk.url}` || '',
      `SDG Tags: ${talk.sdg_tags.join(', ') || ''}`,
      `Transcript: ${talk.transcript}` || '',
    ];

    for (const part of messageParts) {
      console.debug(`[sendTranscriptAsMessage] Sending part: ${part}`);
      const dispatchedMessage = dispatch(sendMessage({ text: part, hidden: false }));
      console.debug('[sendTranscriptAsMessage] Dispatched message:', dispatchedMessage);
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      console.debug(`[openTranscriptInNewTab] Opening transcript for: ${selectedTalk.title}`);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  const shuffleTalks = () => {
    console.debug('[shuffleTalks] Shuffling talks.');
    dispatch(setTalks(shuffleArray(talks)));
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
            onError={() => console.error('Failed to load iframe')}
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
