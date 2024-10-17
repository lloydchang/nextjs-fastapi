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
import { localStorageUtil } from 'components/utils/localStorage'; // Import the localStorage utility
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

  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for scrollable container

  useEffect(() => {
    if (initialRender.current) {
      console.log('components/organisms/TalkPanel.tsx - Initial mount detected, performing search:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    } else {
      console.log('components/organisms/TalkPanel.tsx - Subsequent render detected, skipping search.');
    }

    // Cleanup function to abort any pending requests when component unmounts or before next effect run
    return () => {
      if (abortControllerRef.current) {
        console.log('components/organisms/TalkPanel.tsx - Aborting request in cleanup function');
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array to run only on mount

  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    console.log('components/organisms/TalkPanel.tsx - Search results received for query:', query, 'Data:', data);
    let processedData = data;

    if (isFirstSearch.current) {
      processedData = shuffleArray(data);
      isFirstSearch.current = false;
      console.log('components/organisms/TalkPanel.tsx - Shuffling talks for the first search query.');
    }

    // Dispatch all fetched talks
    dispatch(setTalks([...talks, ...processedData]));

    // Immediately set the first talk as selected if none is currently selected
    if (!selectedTalk && processedData.length > 0) {
      dispatch(setSelectedTalk(processedData[0])); // Select the first talk
      console.log('components/organisms/TalkPanel.tsx - New selected talk:', processedData[0].title);
    }

    // Save fetched data to localStorage
    localStorageUtil.setItem('lastSearchData', JSON.stringify(processedData));

    // Send the transcript for the first available talk
    await sendFirstAvailableTranscript(query, processedData);
  };

  const performSearch = async (query: string) => {
    if (isSearchInProgress.current) {
      console.log('components/organisms/TalkPanel.tsx - Search is already in progress, skipping new search.');
      return;
    }

    if (abortControllerRef.current) {
      console.log('components/organisms/TalkPanel.tsx - Aborting the previous request');
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController(); // Create a new AbortController for the new search
    isSearchInProgress.current = true;
    dispatch(setError(null));
    dispatch(setLoading(true));

    try {
      let finalQuery = query;

      // If the user enters "sdg", randomly select one of the 17 SDGs
      if (query.toLowerCase() === 'sdg') {
        const sdgKeys = Object.keys(sdgTitleMap).filter(key => key.startsWith('sdg') && key !== 'sdg'); // Exclude 'sdg' key
        const randomSdgKey = sdgKeys[Math.floor(Math.random() * sdgKeys.length)]; // Randomly select an SDG key
        finalQuery = randomSdgKey; // Use the selected key as the query
        console.log('Randomly selected SDG for search:', sdgTitleMap[randomSdgKey]); // Log the selected SDG
      }

      console.log(`components/organisms/TalkPanel.tsx - Performing search with query: ${finalQuery}`);
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(finalQuery)}`,
        { signal: abortControllerRef.current.signal } // Use the new AbortController signal
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

      console.log('components/organisms/TalkPanel.tsx - Successfully fetched talks:', data);
      await handleSearchResults(finalQuery, data);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('components/organisms/TalkPanel.tsx - Request aborted:', error.message);
      } else {
        console.error('components/organisms/TalkPanel.tsx - Error during performSearch:', error);
        dispatch(setError('Error fetching talks. Please try again.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false; // Reset flag even on abort or failure
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  const sendTranscriptForTalk = async (query: string, talk: Talk): Promise<void> => {
    console.log(`components/organisms/TalkPanel.tsx - Checking if talk already dispatched or sent: ${talk.title}`);
    console.log('Current lastDispatchedTalkId:', lastDispatchedTalkId.current);
    console.log('HasSentMessage set:', [...hasSentMessage.current]);

    if (lastDispatchedTalkId.current === talk.title || hasSentMessage.current.has(talk.title)) {
      console.log(`components/organisms/TalkPanel.tsx - Skipping already dispatched or sent talk: ${talk.title}`);
      return;
    }

    // Move the selected talk logic and other side effects before dispatching the message
    dispatch(setSelectedTalk(talk));
    lastDispatchedTalkId.current = talk.title;
    hasSentMessage.current.add(talk.title);
    console.log('Updated lastDispatchedTalkId:', lastDispatchedTalkId.current);
    console.log('Updated HasSentMessage set:', [...hasSentMessage.current]);

    // Dispatch the message as the final step
    try {
      const sendTranscript = talk.transcript || '';
      const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

      const result = await dispatch(
        sendMessage({ text: `${query}`, hidden: true })
        sendMessage({ text: `${talk.title}`, hidden: true })
        sendMessage({ text: `${sendTranscript}`, hidden: true })
        sendMessage({ text: `${sendSdgTag}`, hidden: true })
      );
      console.log(`components/organisms/TalkPanel.tsx - Successfully sent message for talk: ${talk.title}. Result:`, result);
    } catch (dispatchError) {
      console.error(`components/organisms/TalkPanel.tsx - Failed to send transcript for ${talk.title}:`, dispatchError);
      dispatch(setError(`Failed to send transcript for ${talk.title}.`));
    }
  };

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    console.log('components/organisms/TalkPanel.tsx - Sending first available transcript for query:', query);
    for (let i = 0; i < talks.length; i++) {
      try {
        console.log(`components/organisms/TalkPanel.tsx - Attempting to send transcript for talk: ${talks[i].title}`);
        await sendTranscriptForTalk(query, talks[i]);
        return;
      } catch (error) {
        console.error(`components/organisms/TalkPanel.tsx - Failed to send transcript for talk: ${talks[i].title}. Error:`, error);
      }
    }
    dispatch(setError('Try searching for a different word.'));
  };

  useEffect(() => {
    if (selectedTalk) {
      console.log(`components/organisms/TalkPanel.tsx - New talk selected: ${selectedTalk.title}`);

      // Move selected talk to the top
      const updatedTalks = talks.filter((talk) => talk.title !== selectedTalk.title);
      dispatch(setTalks([selectedTalk, ...updatedTalks]));

      // Scroll to the top
      if (scrollableContainerRef.current) {
        scrollableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      sendTranscriptForTalk(searchQuery, selectedTalk);
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

  return (
    <div className={styles.TalkPanel}>
      {/* Iframe for the selected talk, now placed first */}
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

      {/* Search bar section */}
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
          <button onClick={openTranscriptInNewTab} className={`${styles.button} ${styles.tedButton}`}>
            Transcript
          </button>
        )}
      </div>

      {/* Error message, if any */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* List of talks */}
      {talks.length > 0 && (
        <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
          <div className={styles.resultsContainer}>
            {talks.map((talk, index) => (
              <TalkItem key={index} talk={talk} selected={selectedTalk?.title === talk.title} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
