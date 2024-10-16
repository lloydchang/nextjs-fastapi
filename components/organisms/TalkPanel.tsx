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

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isSearchInProgress = useRef(false);
  const initialRender = useRef(true);
  const hasSentMessage = useRef(new Set<string>());
  const lastDispatchedTalkId = useRef<string | null>(null);
  const isFirstSearch = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  // Ensure `performSearch` is memoized to prevent unnecessary re-renders.
  const performSearch = useCallback(
    async (query: string) => {
      if (isSearchInProgress.current) {
        console.log('Search is already in progress, skipping new search.');
        return;
      }

      if (abortControllerRef.current) {
        console.log('Aborting the previous request');
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      isSearchInProgress.current = true;
      dispatch(setError(null));
      dispatch(setLoading(true));

      try {
        let finalQuery = query;
        if (query.toLowerCase() === 'sdg') {
          const sdgKeys = Object.keys(sdgTitleMap).filter((key) => key.startsWith('sdg') && key !== 'sdg');
          finalQuery = sdgKeys[Math.floor(Math.random() * sdgKeys.length)];
          console.log('Random SDG selected:', sdgTitleMap[finalQuery]);
        }

        console.log(`Performing search with query: ${finalQuery}`);
        const response = await axios.get(
          `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(finalQuery)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (response.status !== 200) throw new Error(`Error: ${response.status} - ${response.statusText}`);

        const data: Talk[] = response.data.results.map((result: any) => ({
          title: result.document.slug.replace(/_/g, ' '),
          url: `https://www.ted.com/talks/${result.document.slug}`,
          sdg_tags: result.document.sdg_tags || [],
          transcript: result.document.transcript || 'Transcript not available',
        }));

        console.log('Fetched talks:', data);
        await handleSearchResults(finalQuery, data);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request aborted:', error.message);
        } else {
          console.error('Error during search:', error);
          dispatch(setError('Error fetching talks. Please try again.'));
        }
      } finally {
        dispatch(setLoading(false));
        isSearchInProgress.current = false;
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (initialRender.current) {
      console.log('Initial mount detected, performing search:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    }

    return () => {
      if (abortControllerRef.current) {
        console.log('Aborting pending requests on cleanup');
        abortControllerRef.current.abort();
      }
    };
  }, [performSearch, searchQuery]);

  const handleSearchResults = useCallback(
    async (query: string, data: Talk[]) => {
      console.log('Handling search results for query:', query, 'Data:', data);
      let processedData = data;

      if (isFirstSearch.current) {
        processedData = shuffleArray(data);
        isFirstSearch.current = false;
        console.log('Shuffled talks for the first search.');
      }

      dispatch(setTalks([...talks, ...processedData]));

      if (!selectedTalk && processedData.length > 0) {
        dispatch(setSelectedTalk(processedData[0]));
        console.log('Selected the first talk:', processedData[0].title);
      }

      localStorageUtil.setItem('lastSearchData', JSON.stringify(processedData));
      await sendFirstAvailableTranscript(query, processedData);
    },
    [dispatch, talks, selectedTalk]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') performSearch(searchQuery);
  };

  const sendTranscriptForTalk = useCallback(
    async (query: string, talk: Talk) => {
      if (lastDispatchedTalkId.current === talk.title || hasSentMessage.current.has(talk.title)) return;

      dispatch(setSelectedTalk(talk));
      lastDispatchedTalkId.current = talk.title;
      hasSentMessage.current.add(talk.title);

      try {
        const sendTranscript = talk.transcript || '';
        const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

        await dispatch(
          sendMessage({ text: `${query} | ${talk.title} | ${sendTranscript} | ${sendSdgTag}`, hidden: true })
        );
        console.log(`Sent message for talk: ${talk.title}`);
      } catch (error) {
        console.error(`Failed to send message for ${talk.title}:`, error);
        dispatch(setError(`Failed to send transcript for ${talk.title}.`));
      }
    },
    [dispatch]
  );

  const sendFirstAvailableTranscript = useCallback(
    async (query: string, talks: Talk[]) => {
      for (const talk of talks) {
        try {
          await sendTranscriptForTalk(query, talk);
          return;
        } catch (error) {
          console.error(`Error sending transcript for ${talk.title}:`, error);
        }
      }
      dispatch(setError('Try searching for a different word.'));
    },
    [dispatch, sendTranscriptForTalk]
  );

  useEffect(() => {
    if (selectedTalk) {
      const updatedTalks = talks.filter((talk) => talk.title !== selectedTalk.title);
      dispatch(setTalks([selectedTalk, ...updatedTalks]));

      if (scrollableContainerRef.current) {
        scrollableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      sendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [selectedTalk, dispatch, sendTranscriptForTalk, searchQuery, talks]);

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
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
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className={styles.searchInput}
        />
        {loading && <LoadingSpinner />}
        <button onClick={() => performSearch(searchQuery)} disabled={loading}>Search</button>
        <button onClick={openTranscriptInNewTab}>Transcript</button>
      </div>

      {error && <div className={styles.errorContainer}><p>{error}</p></div>}

      {talks.length > 0 && (
        <div ref={scrollableContainerRef}>
          {talks.map((talk, index) => (
            <TalkItem key={index} talk={talk} selected={selectedTalk?.title === talk.title} />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
