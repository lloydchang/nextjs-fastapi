// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk, setError, setLoading } from 'store/talkSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { sdgTitleMap } from 'components/constants/sdgTitles';
import { determineInitialKeyword, shuffleArray } from 'components/utils/talkPanelUtils';
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
  const hasFetched = useRef(false);
  const hasSentMessage = useRef(new Set<string>());
  const lastDispatchedTalkId = useRef<string | null>(null);
  const isFirstSearch = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      console.log('TalkPanel - Initial mount detected, performing search:', searchQuery);
      performSearchWithExponentialBackoff(searchQuery);
      hasFetched.current = true;
      initialRender.current = false;
    } else {
      console.log('TalkPanel - Subsequent render detected, skipping search.');
    }
  }, []);  

  // Close all functions and effects correctly here
  // Ensure every block is properly closed before the return statement

  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    console.log('TalkPanel - Search results received for query:', query, 'Data:', data);
    let processedData = data;

    if (isFirstSearch.current) {
      processedData = shuffleArray(data);
      isFirstSearch.current = false;
      console.log('TalkPanel - Shuffling talks for the first search query.');
    }

    const uniqueTalks = processedData.filter(talk => !talks.some(existingTalk => existingTalk.title === talk.title));

    if (uniqueTalks.length > 0) {
      dispatch(setTalks([...talks, ...uniqueTalks]));
      dispatch(setSelectedTalk(uniqueTalks[0] || null));
      await sendFirstAvailableTranscript(query, uniqueTalks);
    } else {
      console.log('TalkPanel - No new unique talks found.');
    }
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const performSearchWithExponentialBackoff = async (query: string) => {
    if (isSearchInProgress.current) {
      console.log('TalkPanel - Search is already in progress, skipping new search.');
      return;
    }

    isSearchInProgress.current = true;
    dispatch(setError(null));
    dispatch(setLoading(true));

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`TalkPanel - Performing search with query: ${query}`);
        const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`);

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
        await handleSearchResults(query, data);
        dispatch(setLoading(false));
        isSearchInProgress.current = false;
        return;
      } catch (error) {
        console.error('TalkPanel - Error during performSearch:', error);
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`TalkPanel - Retrying in ${delay / 1000} seconds...`);
          await wait(delay);
        } else {
          dispatch(setError('Failed to fetch talks after multiple attempts.'));
          dispatch(setLoading(false));
          isSearchInProgress.current = false;
        }
      }
    }
  };

  const throttledPerformSearch = throttle((query: string) => {
    performSearchWithExponentialBackoff(query);
  }, 3000);  // Throttle searches to every 3 seconds

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      throttledPerformSearch(searchQuery);
    }
  };

  const sendTranscriptForTalk = async (query: string, talk: Talk, retryCount = 0): Promise<void> => {
    console.log(`TalkPanel - Checking if talk already dispatched or sent: ${talk.title}`);
    console.log('Current lastDispatchedTalkId:', lastDispatchedTalkId.current);
    console.log('HasSentMessage set:', [...hasSentMessage.current]);

    if (lastDispatchedTalkId.current === talk.title || hasSentMessage.current.has(talk.title)) {
      console.log(`TalkPanel - Skipping already dispatched or sent talk: ${talk.title}`);
      return;
    }

    console.log(`TalkPanel - Sending transcript for talk: ${talk.title}`);
    const sendTranscript = talk.transcript || 'Transcript not available';
    const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

    try {
      const result = await dispatch(sendMessage({ text: `${query} | ${talk.title} | ${sendTranscript} | ${sendSdgTag}`, hidden: true }));
      console.log(`TalkPanel - Successfully sent message for talk: ${talk.title}. Result:`, result);
      dispatch(setSelectedTalk(talk));
      lastDispatchedTalkId.current = talk.title; 
      hasSentMessage.current.add(talk.title); 
      console.log('Updated lastDispatchedTalkId:', lastDispatchedTalkId.current);
      console.log('Updated HasSentMessage set:', [...hasSentMessage.current]);
    } catch (dispatchError) {
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.error(`TalkPanel - Error dispatching message for ${talk.title}. Retrying in ${delay / 1000} seconds...`);
        await wait(delay);
        await sendTranscriptForTalk(query, talk, retryCount + 1);
      } else {
        console.error(`TalkPanel - Failed to send transcript for ${talk.title} after multiple attempts.`);
        dispatch(setError(`Failed to send transcript for ${talk.title}.`));
      }
    }
  };

  const throttledSendTranscriptForTalk = throttle((query: string, talk: Talk) => {
    console.log(`TalkPanel - Throttled send for talk: ${talk.title}`);
    sendTranscriptForTalk(query, talk);
  }, 3000);  // Throttle sending messages to once every 3 seconds

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    console.log('TalkPanel - Sending first available transcript for query:', query);
    for (let i = 0; i < talks.length; i++) {
      try {
        console.log(`TalkPanel - Attempting to send transcript for talk: ${talks[i].title}`);
        await throttledSendTranscriptForTalk(query, talks[i]);
        return;
      } catch (error) {
        console.error(`TalkPanel - Failed to send transcript for talk: ${talks[i].title}. Error:`, error);
      }
    }
    dispatch(setError('Failed to send transcripts for all talks.'));
  };

  useEffect(() => {
    if (searchQuery && selectedTalk) {
      console.log(`TalkPanel - Sending transcript for: ${selectedTalk.title}`);
      throttledSendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedTalk) {
      console.log(`TalkPanel - New talk selected: ${selectedTalk.title}`);
      throttledSendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [selectedTalk]);

  const shuffleTalks = async () => {
    if (talks.length > 0) {
      const shuffledTalks = shuffleArray([...talks]);
      dispatch(setTalks(shuffledTalks));
      dispatch(setSelectedTalk(shuffledTalks[0] || null));
      await handleSearchResults(searchQuery, shuffledTalks);
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
    }
  };

  // Ensure return statement is correct and follows the JSX rules
  return (
    <div className={styles.TalkPanel}>
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
          />
          {loading && <LoadingSpinner />}
        </div>
        <button
          onClick={() => throttledPerformSearch(searchQuery)}
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

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

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

      {talks.length > 0 && (
        <div className={styles.scrollableContainer}>
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <TalkItem key={index} talk={talk} selected={selectedTalk?.title === talk.title} /> {/* Pass selected prop */}
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
