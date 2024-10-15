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
import debounce from 'lodash/debounce';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isSearchInProgress = useRef(false); // Track if search is in progress
  const initialRender = useRef(true); // Track initial render
  const hasFetched = useRef(false); // Track if data has been fetched
  const hasSentMessage = useRef(new Set<string>()); // Track sent messages to avoid re-sending
  const lastDispatchedTalkId = useRef<string | null>(null); // Track the last dispatched talk ID
  const isMounted = useRef(false); // Track if component is mounted

  useEffect(() => {
    if (isMounted.current && !hasFetched.current) {
      console.log('TalkPanel - Initial render, do not search yet.');
      return;
    } else if (!isMounted.current) {
      console.log('TalkPanel - Initial mount detected, performing search:', searchQuery);
      performSearchWithExponentialBackoff(searchQuery);
      hasFetched.current = true; // Ensure only one fetch occurs
      isMounted.current = true;
    }
  
    return () => {
      isMounted.current = false;
      // Intentionally, no reset of hasFetched.current nor hasSentMessage.current
    };
  }, [searchQuery, selectedTalk]);  

  // Handle search results
  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    console.log('TalkPanel - Search results received for query:', query, 'Data:', data);
    dispatch(setTalks(data));
    dispatch(setSelectedTalk(data[0] || null));
    await sendFirstAvailableTranscript(query, data);
  };

  // Utility function to wait
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Perform search with exponential backoff logic
  const performSearchWithExponentialBackoff = async (query: string) => {
    if (isSearchInProgress.current) {
      console.log('TalkPanel - Search is already in progress, skipping new search.');
      return;
    }

    isSearchInProgress.current = true; // Mark search as in progress
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

  // Send transcript for a selected talk
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
      lastDispatchedTalkId.current = talk.title; // Update the last dispatched talk ID
      hasSentMessage.current.add(talk.title); // Mark message as sent
      console.log('Updated lastDispatchedTalkId:', lastDispatchedTalkId.current);
      console.log('Updated HasSentMessage set:', [...hasSentMessage.current]);
    } catch (dispatchError) {
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.error(`TalkPanel - Error dispatching message for ${talk.title}. Retrying in ${delay / 1000} seconds...`);
        await wait(delay);
        await sendTranscriptForTalk(query, talk, retryCount + 1); // Recursive retry
      } else {
        console.error(`TalkPanel - Failed to send transcript for ${talk.title} after multiple attempts.`);
        dispatch(setError(`Failed to send transcript for ${talk.title}.`));
      }
    }
  };

  // Debounced send for talk transcript
  const debouncedSendTranscriptForTalk = debounce((query: string, talk: Talk) => {
    console.log(`TalkPanel - Debounced send for talk: ${talk.title}`);
    sendTranscriptForTalk(query, talk);
  }, 1000); // Debounce time: 1 second

  // Send the first available transcript from a list of talks
  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    console.log('TalkPanel - Sending first available transcript for query:', query);
    for (let i = 0; i < talks.length; i++) {
      try {
        console.log(`TalkPanel - Attempting to send transcript for talk: ${talks[i].title}`);
        await debouncedSendTranscriptForTalk(query, talks[i]);
        return;
      } catch (error) {
        console.error(`TalkPanel - Failed to send transcript for talk: ${talks[i].title}. Error:`, error);
      }
    }
    dispatch(setError('Failed to send transcripts for all talks.'));
  };

  // Handle search query change
  useEffect(() => {
    if (searchQuery && selectedTalk) {
      console.log(`TalkPanel - Sending transcript for: ${selectedTalk.title}`);
      debouncedSendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [searchQuery]); // Only run this effect when searchQuery changes

  // Handle new talk selection
  useEffect(() => {
    if (selectedTalk) {
      console.log(`TalkPanel - New talk selected: ${selectedTalk.title}`);
      debouncedSendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [selectedTalk]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearchWithExponentialBackoff(searchQuery);
    }
  };

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
          onClick={() => performSearchWithExponentialBackoff(searchQuery)}
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
              <TalkItem key={index} talk={talk} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
