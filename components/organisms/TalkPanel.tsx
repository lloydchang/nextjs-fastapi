// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk, setError, setLoading } from 'store/talkSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { sdgTitleMap } from 'components/constants/sdgTitles';
import { determineInitialKeyword, shuffleArray } from 'components/utils/talkPanelUtils';
import { localStorageUtil } from 'components/utils/localStorage';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import throttle from 'lodash/throttle';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState<string>(determineInitialKeyword());
  const isSearchInProgress = useRef(false);
  const initialRender = useRef(true);
  const hasSentMessage = useRef(new Set<string>());
  const lastDispatchedTalkId = useRef<string | null>(null);
  const isFirstSearch = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const abortPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      if (isSearchInProgress.current) return;

      abortPendingRequest(); // Abort previous request, if any
      isSearchInProgress.current = true;
      dispatch(setError(null));
      dispatch(setLoading(true));
      abortControllerRef.current = new AbortController();

      try {
        let finalQuery = query;
        if (query.toLowerCase() === 'sdg') {
          const sdgKeys = Object.keys(sdgTitleMap).filter(key => key.startsWith('sdg'));
          finalQuery = sdgKeys[Math.floor(Math.random() * sdgKeys.length)];
        }

        const response = await axios.get(
          `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(finalQuery)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (response.status === 200) {
          const data: Talk[] = response.data.results.map((result: any) => ({
            title: result.document.slug.replace(/_/g, ' '),
            url: `https://www.ted.com/talks/${result.document.slug}`,
            sdg_tags: result.document.sdg_tags || [],
            transcript: result.document.transcript || 'Transcript not available',
          }));

          await handleSearchResults(finalQuery, data);
        } else {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          dispatch(setError('Error fetching talks. Please try again.'));
        }
      } finally {
        isSearchInProgress.current = false;
        dispatch(setLoading(false));
      }
    },
    [abortPendingRequest, dispatch]
  );

  const handleSearchResults = useCallback(
    async (query: string, data: Talk[]) => {
      const processedData = isFirstSearch.current ? shuffleArray(data) : data;
      isFirstSearch.current = false;

      dispatch(setTalks([...talks, ...processedData]));
      if (!selectedTalk && processedData.length > 0) {
        dispatch(setSelectedTalk(processedData[0]));
      }

      localStorageUtil.setItem('lastSearchData', JSON.stringify(processedData));
      await sendFirstAvailableTranscript(query, processedData);
    },
    [dispatch, selectedTalk, talks]
  );

  const sendFirstAvailableTranscript = useCallback(
    async (query: string, talks: Talk[]) => {
      for (const talk of talks) {
        if (!hasSentMessage.current.has(talk.title)) {
          await sendTranscriptForTalk(query, talk);
          break;
        }
      }
      dispatch(setError('Try searching for a different word.'));
    },
    [dispatch]
  );

  const sendTranscriptForTalk = useCallback(
    async (query: string, talk: Talk) => {
      if (hasSentMessage.current.has(talk.title)) return;

      dispatch(setSelectedTalk(talk));
      hasSentMessage.current.add(talk.title);

      try {
        await Promise.all([
          dispatch(sendMessage({ text: query, hidden: true })),
          dispatch(sendMessage({ text: talk.title, hidden: true })),
          dispatch(sendMessage({ text: talk.transcript || '', hidden: true })),
          dispatch(sendMessage({ text: talk.sdg_tags[0] || '', hidden: true })),
        ]);
      } catch (error) {
        dispatch(setError(`Failed to send transcript for ${talk.title}.`));
      }
    },
    [dispatch]
  );

  const shuffleTalks = useCallback(async () => {
    if (talks.length > 0) {
      const shuffledTalks = shuffleArray([...talks]);
      dispatch(setTalks(shuffledTalks));
      dispatch(setSelectedTalk(shuffledTalks[0]));
      await handleSearchResults(searchQuery, shuffledTalks);
    }
  }, [dispatch, handleSearchResults, searchQuery, talks]);

  useEffect(() => {
    if (initialRender.current) {
      performSearch(searchQuery);
      initialRender.current = false;
    }

    return abortPendingRequest;
  }, [performSearch, abortPendingRequest, searchQuery]);

  useEffect(() => {
    if (selectedTalk) {
      const updatedTalks = talks.filter(talk => talk.title !== selectedTalk.title);
      dispatch(setTalks([selectedTalk, ...updatedTalks]));

      scrollableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      sendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [dispatch, searchQuery, selectedTalk, talks, sendTranscriptForTalk]);

  return (
    <div className={styles.TalkPanel}>
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.split('/').pop()}`}
            width="100%"
            height="400px"
            allow="autoplay; fullscreen"
            className={styles.videoFrame}
          />
        </div>
      )}
      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
          className={styles.searchInput}
        />
        {loading && <LoadingSpinner />}
        <button onClick={() => performSearch(searchQuery)} disabled={loading}>
          Search
        </button>
        <button onClick={shuffleTalks}>Shuffle</button>
        {selectedTalk && <button onClick={() => window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank')}>Transcript</button>}
      </div>
      {error && <div className={styles.errorContainer}>{error}</div>}
      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        <div className={styles.resultsContainer}>
          {talks.map((talk, index) => (
            <TalkItem key={index} talk={talk} selected={selectedTalk?.title === talk.title} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
