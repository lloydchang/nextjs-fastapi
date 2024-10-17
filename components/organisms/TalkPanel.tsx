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
import { sdgTitleMap } from 'components/constants/sdgTitles';
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
  const lastDispatchedTalkId = useRef<string | null>(null);
  const isFirstSearch = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const sentMessagesRef = useRef<Set<string>>(new Set());

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  console.debug('TalkPanel: Initializing component...');

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      console.debug('Debounced search triggered for query:', query);
      performSearch(query);
    }, 500),
    []
  );

  const createAbortController = () => {
    console.debug('Creating new AbortController...');
    if (abortControllerRef.current) {
      console.debug('Aborting previous request...');
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  useEffect(() => {
    console.debug('useEffect: Checking if this is the initial render...');
    if (initialRender.current) {
      console.debug('Performing initial search with query:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    }

    return () => {
      console.debug('Cleanup: Aborting ongoing requests and canceling debounced search.');
      if (abortControllerRef.current) abortControllerRef.current.abort();
      debouncedPerformSearch.cancel();
    };
  }, []);

  const handleSearchResults = async (query: string, data: Talk[]) => {
    console.debug('Handling search results for query:', query);
    console.debug('Received data:', data);

    const processedData = isFirstSearch.current ? shuffleArray(data) : data;
    isFirstSearch.current = false;

    const uniqueTalks = processedData.filter(
      (newTalk) => !talks.some((existingTalk) => existingTalk.url === newTalk.url)
    );

    console.debug('Unique talks after filtering:', uniqueTalks);

    dispatch(setTalks(uniqueTalks));

    if (!selectedTalk && uniqueTalks.length > 0) {
      console.debug('Setting first talk as selected:', uniqueTalks[0]);
      dispatch(setSelectedTalk(uniqueTalks[0]));
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(uniqueTalks));
    await sendFirstAvailableTranscript(query, uniqueTalks);
  };

  const performSearch = async (query: string) => {
    console.debug('Performing search with query:', query);
    const trimmedQuery = query.trim().toLowerCase();

    if (isSearchInProgress.current && trimmedQuery === lastQueryRef.current) {
      console.debug('Search already in progress for the same query. Skipping...');
      return;
    }

    const controller = createAbortController();
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery;
    dispatch(setApiError(null));
    dispatch(setLoading(true));

    try {
      const finalQuery =
        trimmedQuery === 'sdg'
          ? Object.keys(sdgTitleMap).filter((key) => key.startsWith('sdg'))[
              Math.floor(Math.random() * 17)
            ]
          : trimmedQuery;

      console.debug('Final search query:', finalQuery);

      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(finalQuery)}`,
        { signal: controller.signal }
      );

      console.debug('Received response:', response);

      if (response.status !== 200) throw new Error(response.statusText);

      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));

      await handleSearchResults(finalQuery, data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching talks:', error);
        dispatch(setApiError('Error fetching talks.'));
      }
    } finally {
      console.debug('Search completed. Setting loading to false.');
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  const sendTranscriptForTalk = async (query: string, talk: Talk) => {
    console.debug('Sending transcript for talk:', talk.title);

    try {
      if (lastDispatchedTalkId.current === talk.title || sentMessagesRef.current.has(talk.title)) {
        console.debug(`Skipping already dispatched talk: ${talk.title}`);
        return;
      }

      dispatch(setSelectedTalk(talk));
      lastDispatchedTalkId.current = talk.title;
      sentMessagesRef.current.add(talk.title);

      const messageParts = [query, talk.title, talk.transcript, talk.sdg_tags[0] || ''];

      for (const part of messageParts) {
        console.debug(`Sending message part: ${part}`);
        const result = await dispatch(sendMessage({ text: part, hidden: true }));

        if (result.error) {
          console.error(`Failed to send message: ${part}`, result.error);
          dispatch(setApiError(`Failed to send message: ${part}`));
          return;
        }

        console.debug(`Successfully sent message part: ${part}`);
      }
    } catch (error) {
      console.error(`Error sending transcript for ${talk.title}:`, error);
      dispatch(setApiError(`Failed to send transcript for ${talk.title}.`));
    }
  };

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]) => {
    console.debug('Sending first available transcript...');
    for (const talk of talks) {
      try {
        await sendTranscriptForTalk(query, talk);
        break;
      } catch (error) {
        console.error('Error sending transcript:', error);
      }
    }
    dispatch(setApiError('Try searching for a different word.'));
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      console.debug('Opening transcript in new tab:', selectedTalk.url);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
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
          onClick={() => shuffleTalks()}
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
