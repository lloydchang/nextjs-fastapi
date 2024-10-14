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
  const [lastDispatchedTalkId, setLastDispatchedTalkId] = useState<string | null>(null);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      performSearchWithExponentialBackoff(searchQuery);
      initialRender.current = false;
    }
  }, [searchQuery]);

  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    dispatch(setTalks(data));
    dispatch(setSelectedTalk(data[0] || null));
    await sendFirstAvailableTranscript(query, data);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Exponential backoff search function with retries
  const performSearchWithExponentialBackoff = async (query: string) => {
    dispatch(setError(null));
    dispatch(setLoading(true));

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`);
        if (response.status !== 200) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        let data: Talk[] = response.data.results.map((result: any) => ({
          title: result.document.slug.replace(/_/g, ' '),
          url: `https://www.ted.com/talks/${result.document.slug}`,
          sdg_tags: result.document.sdg_tags || [],
          transcript: result.document.transcript || 'Transcript not available',
        }));

        await handleSearchResults(query, data);
        dispatch(setLoading(false));
        return; // Successful fetch, exit the loop
      } catch (error) {
        console.error('Error during performSearch:', error);
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await wait(delay);
        } else {
          dispatch(setError('Failed to fetch talks after multiple attempts.'));
          dispatch(setLoading(false));
        }
      }
    }
  };

  const sendTranscriptForTalk = async (query: string, talk: Talk): Promise<void> => {
    if (talk.title === lastDispatchedTalkId) {
      return;
    }

    const sendTranscript = talk.transcript || 'Transcript not available';
    const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

    try {
      const result = await dispatch(sendMessage({ text: `${query} | ${talk.title} | ${sendTranscript} | ${sendSdgTag}`, hidden: true }));
      dispatch(setSelectedTalk(talk));
      setLastDispatchedTalkId(talk.title);
    } catch (dispatchError) {
      dispatch(setError(`Failed to send transcript for ${talk.title}.`));
    }
  };

  const debouncedSendTranscriptForTalk = debounce(sendTranscriptForTalk, 1500);

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    for (let i = 0; i < talks.length; i++) {
      try {
        await debouncedSendTranscriptForTalk(query, talks[i]);
        return;
      } catch (error) {
        console.error(`Failed to send transcript for talk: ${talks[i].title}. Error:`, error);
      }
    }
    dispatch(setError('Failed to send transcripts for all talks.'));
  };

  useEffect(() => {
    if (selectedTalk) {
      debouncedSendTranscriptForTalk(searchQuery, selectedTalk);
    }
  }, [selectedTalk, searchQuery]);

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
            placeholder=""
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
        <button
          onClick={shuffleTalks}
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
