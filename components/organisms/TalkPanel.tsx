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

  // Debounced search to prevent rapid API calls
  const debouncedPerformSearch = useCallback(
    debounce((query: string) => performSearch(query), 500),
    []
  );

  useEffect(() => {
    if (initialRender.current) {
      performSearch(searchQuery);
      initialRender.current = false;
    }

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      debouncedPerformSearch.cancel();
    };
  }, []);

  const handleSearchResults = async (query: string, data: Talk[]) => {
    const processedData = isFirstSearch.current ? shuffleArray(data) : data;
    isFirstSearch.current = false;

    const uniqueTalks = processedData.filter(
      (newTalk) => !talks.some((existingTalk) => existingTalk.url === newTalk.url)
    );

    dispatch(setTalks(uniqueTalks));

    if (!selectedTalk && uniqueTalks.length > 0) {
      dispatch(setSelectedTalk(uniqueTalks[0]));
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(uniqueTalks));
    await sendFirstAvailableTranscript(query, uniqueTalks);
  };

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();

    if (isSearchInProgress.current && trimmedQuery === lastQueryRef.current) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();

    abortControllerRef.current = new AbortController();
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

      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(finalQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.status !== 200) throw new Error(response.statusText);

      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));

      await handleSearchResults(finalQuery, data);
    } catch (error) {
      if (!axios.isCancel(error)) dispatch(setApiError('Error fetching talks.'));
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  const sendTranscriptForTalk = async (query: string, talk: Talk) => {
    try {
      if (
        lastDispatchedTalkId.current === talk.title ||
        sentMessagesRef.current.has(talk.title)
      ) {
        console.log(`Skipping already dispatched talk: ${talk.title}`);
        return;
      }

      dispatch(setSelectedTalk(talk));
      lastDispatchedTalkId.current = talk.title;
      sentMessagesRef.current.add(talk.title);

      const messageParts = [
        query,
        talk.title,
        talk.transcript,
        talk.sdg_tags[0] || '',
      ];

      for (const part of messageParts) {
        console.log(`Sending message part: ${part}`);
        const result = await dispatch(sendMessage({ text: part, hidden: true }));
        console.log('sendMessage result:', result);

        if (sendMessage.rejected.match(result)) {
          console.error(`Failed to send message: ${part}`, result.payload);
          dispatch(setApiError(`Failed to send message: ${part}`));
          return;
        }

        console.log(`Successfully sent message part: ${part}`);
      }
    } catch (error) {
      console.error(`Error sending transcript for ${talk.title}:`, error);
      dispatch(setApiError(`Failed to send transcript for ${talk.title}.`));
    }
  };

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]) => {
    for (const talk of talks) {
      try {
        await sendTranscriptForTalk(query, talk);
        // If successful, exit the loop
        return;
      } catch {
        // Continue to the next talk if there's an error
      }
    }
    // If all talks failed
    dispatch(setApiError('Try searching for a different word.'));
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk)
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
  };

  const shuffleTalks = () => {
    dispatch(setTalks(shuffleArray(talks)));
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
