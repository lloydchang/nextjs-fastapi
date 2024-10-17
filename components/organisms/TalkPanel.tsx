// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice'; // Updated import
import { setLoading, setApiError } from 'store/apiSlice'; // Correct imports from apiSlice
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { sdgTitleMap } from 'components/constants/sdgTitles';
import { determineInitialKeyword, shuffleArray } from 'components/utils/talkPanelUtils';
import { localStorageUtil } from 'components/utils/localStorage'; // Import the localStorage utility
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from 'lodash';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api); // Access loading and error from api slice

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isSearchInProgress = useRef(false);
  const initialRender = useRef(true);
  const lastDispatchedTalkId = useRef<string | null>(null);
  const isFirstSearch = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>(''); // Tracks the last search query
  const sentMessagesRef = useRef<Set<string>>(new Set());

  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for scrollable container

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 500),
    []
  );

  useEffect(() => {
    if (initialRender.current) {
      console.log('TalkPanel - Initial mount detected, performing search:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    }

    return () => {
      if (abortControllerRef.current) {
        console.log('TalkPanel - Aborting request in cleanup function');
        abortControllerRef.current.abort();
      }
      debouncedPerformSearch.cancel();
    };
  }, []);

  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    console.log('TalkPanel - Search results received for query:', query, 'Data:', data);
    let processedData = data;

    if (isFirstSearch.current) {
      processedData = shuffleArray(data);
      isFirstSearch.current = false;
      console.log('TalkPanel - Shuffling talks for the first search query.');
    }

    dispatch(setTalks([...talks, ...processedData]));

    if (!selectedTalk && processedData.length > 0) {
      dispatch(setSelectedTalk(processedData[0]));
      console.log('TalkPanel - New selected talk:', processedData[0].title);
    }

    localStorageUtil.setItem('lastSearchData', JSON.stringify(processedData));
    await sendFirstAvailableTranscript(query, processedData);
  };

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();

    if (isSearchInProgress.current && trimmedQuery === lastQueryRef.current) {
      console.log('TalkPanel - Same query in progress, skipping search:', trimmedQuery);
      return;
    }

    if (abortControllerRef.current) {
      console.log('TalkPanel - Aborting the previous request');
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery;

    dispatch(setApiError(null));
    dispatch(setLoading(true));

    try {
      let finalQuery = trimmedQuery;

      if (trimmedQuery === 'sdg') {
        const sdgKeys = Object.keys(sdgTitleMap).filter(
          (key) => key.startsWith('sdg') && key !== 'sdg'
        );
        const randomSdgKey = sdgKeys[Math.floor(Math.random() * sdgKeys.length)];
        finalQuery = randomSdgKey;
        console.log('TalkPanel - Randomly selected SDG for search:', sdgTitleMap[randomSdgKey]);
      }

      console.log(`TalkPanel - Performing search with query: ${finalQuery}`);
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(finalQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));

      console.log('TalkPanel - Successfully fetched talks:', data);
      await handleSearchResults(finalQuery, data);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('TalkPanel - Request aborted:', error.message);
      } else {
        console.error('TalkPanel - Error during performSearch:', error);
        dispatch(setApiError('Error fetching talks. Please try again.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedPerformSearch(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      debouncedPerformSearch.cancel();
      performSearch(searchQuery);
    }
  };

  const sendTranscriptForTalk = async (query: string, talk: Talk): Promise<void> => {
    if (lastDispatchedTalkId.current === talk.title || sentMessagesRef.current.has(talk.title)) {
      return;
    }

    dispatch(setSelectedTalk(talk));
    lastDispatchedTalkId.current = talk.title;
    sentMessagesRef.current.add(talk.title);

    try {
      const sendTranscript = talk.transcript || '';
      const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

      const messageParts = [query, talk.title, sendTranscript, sendSdgTag];

      for (const part of messageParts) {
        await dispatch(sendMessage({ text: part, hidden: true }));
      }
    } catch (error) {
      console.error(`Failed to send transcript for ${talk.title}:`, error);
      dispatch(setApiError(`Failed to send transcript for ${talk.title}.`));
    }
  };

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    for (const talk of talks) {
      try {
        await sendTranscriptForTalk(query, talk);
        return;
      } catch (error) {
        console.error(`Failed to send transcript for ${talk.title}. Error:`, error);
      }
    }
    dispatch(setApiError('Try searching for a different word.'));
  };

  const shuffleTalks = async () => {
    const shuffledTalks = shuffleArray([...talks]);
    dispatch(setTalks(shuffledTalks));
    dispatch(setSelectedTalk(shuffledTalks[0] || null));
    await handleSearchResults(searchQuery, shuffledTalks);
  };

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
            title={`${selectedTalk.title} video`}
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
            placeholder="Search for talks..."
          />
          {loading && <LoadingSpinner />}
        </div>

        <button onClick={() => performSearch(searchQuery)} disabled={loading}>
          Search
        </button>
        <button onClick={shuffleTalks}>Shuffle</button>
        {selectedTalk && (
          <button onClick={openTranscriptInNewTab}>Transcript</button>
        )}
      </div>

      {error && <div className={styles.errorText}>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk) => (
          <TalkItem key={talk.url} talk={talk} selected={selectedTalk?.title === talk.title} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
