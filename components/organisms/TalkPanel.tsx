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
import { localStorageUtil } from 'components/utils/localStorage'; // Import the localStorage utility
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from 'lodash'; // Import debounce from lodash
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const isSearchInProgress = useRef(false);
  const initialRender = useRef(true);
  const lastDispatchedTalkId = useRef<string | null>(null);
  const isFirstSearch = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>(''); // Tracks the last search query
  const sentMessagesRef = useRef<Set<string>>(new Set()); // Tracks talks with sent messages

  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for scrollable container

  /**
   * Debounced version of performSearch to prevent rapid, successive searches.
   * The search will only be triggered 500ms after the user stops typing.
   */
  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 500),
    [] // The debounce function is created only once
  );

  useEffect(() => {
    if (initialRender.current) {
      console.log('TalkPanel - Initial mount detected, performing search:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    } else {
      console.log('TalkPanel - Subsequent render detected, skipping initial search.');
    }

    // Cleanup function to abort any pending requests and cancel debounce on unmount
    return () => {
      if (abortControllerRef.current) {
        console.log('TalkPanel - Aborting request in cleanup function');
        abortControllerRef.current.abort();
      }
      debouncedPerformSearch.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount

  /**
   * Handles the search results by processing the data, updating the state,
   * saving to localStorage, and sending transcripts.
   */
  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    console.log('TalkPanel - Search results received for query:', query, 'Data:', data);
    let processedData = data;

    if (isFirstSearch.current) {
      processedData = shuffleArray(data);
      isFirstSearch.current = false;
      console.log('TalkPanel - Shuffling talks for the first search query.');
    }

    // Dispatch all fetched talks
    dispatch(setTalks([...talks, ...processedData]));

    // Immediately set the first talk as selected if none is currently selected
    if (!selectedTalk && processedData.length > 0) {
      dispatch(setSelectedTalk(processedData[0])); // Select the first talk
      console.log('TalkPanel - New selected talk:', processedData[0].title);
    }

    // Save fetched data to localStorage
    localStorageUtil.setItem('lastSearchData', JSON.stringify(processedData));

    // Send the transcript for the first available talk
    await sendFirstAvailableTranscript(query, processedData);
  };

  /**
   * Performs the search operation by making an API call.
   * It aborts any ongoing requests before initiating a new one.
   */
  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase(); // Normalize query

    // Prevent duplicate searches for the same query
    if (isSearchInProgress.current && trimmedQuery === lastQueryRef.current) {
      console.log('TalkPanel - Same query in progress, skipping search:', trimmedQuery);
      return;
    }

    // Abort the previous request if a new, different search is initiated
    if (abortControllerRef.current) {
      console.log('TalkPanel - Aborting the previous request');
      abortControllerRef.current.abort();
    }

    // Create a new AbortController for the new search
    abortControllerRef.current = new AbortController();
    isSearchInProgress.current = true;
    lastQueryRef.current = trimmedQuery; // Update the last query
    dispatch(setError(null));
    dispatch(setLoading(true));

    try {
      let finalQuery = trimmedQuery;

      // If the user enters "sdg", randomly select one of the 17 SDGs
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
        { signal: abortControllerRef.current.signal } // Use the AbortController signal
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
    } catch (error: any) { // Type as any to handle AxiosError
      if (axios.isCancel(error)) {
        console.log('TalkPanel - Request aborted:', error.message);
      } else {
        console.error('TalkPanel - Error during performSearch:', error);
        dispatch(setError('Error fetching talks. Please try again.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false; // Reset flag even on abort or failure
    }
  };

  /**
   * Handles changes in the search input field.
   * Utilizes debouncing to delay the search operation.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedPerformSearch(e.target.value);
  };

  /**
   * Handles the Enter key press in the search input to trigger the search immediately.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      debouncedPerformSearch.cancel(); // Cancel any pending debounced search
      performSearch(searchQuery);
    }
  };

  /**
   * Sends the transcript for a specific talk.
   * Ensures that each talk's transcript is sent only once.
   */
  const sendTranscriptForTalk = async (query: string, talk: Talk): Promise<void> => {
    console.log(`TalkPanel - Checking if talk already dispatched or sent: ${talk.title}`);
    console.log('Current lastDispatchedTalkId:', lastDispatchedTalkId.current);
    console.log('SentMessages set:', [...sentMessagesRef.current]);

    if (lastDispatchedTalkId.current === talk.title || sentMessagesRef.current.has(talk.title)) {
      console.log(`TalkPanel - Skipping already dispatched or sent talk: ${talk.title}`);
      return;
    }

    // Move the selected talk logic and other side effects before dispatching the message
    dispatch(setSelectedTalk(talk));
    lastDispatchedTalkId.current = talk.title;
    sentMessagesRef.current.add(talk.title);
    console.log('Updated lastDispatchedTalkId:', lastDispatchedTalkId.current);
    console.log('Updated SentMessages set:', [...sentMessagesRef.current]);

    // Dispatch the messages as the final step
    try {
      const sendTranscript = talk.transcript || '';
      const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

      const messageParts = [
        `${query}`,
        `${talk.title}`,
        `${sendTranscript}`,
        `${sendSdgTag}`
      ];

      for (const part of messageParts) {
        const result = await dispatch(sendMessage({ text: part, hidden: true }));
        console.log(`TalkPanel - Successfully sent message part: ${part}. Result:`, result);
      }
    } catch (dispatchError) {
      console.error(`TalkPanel - Failed to send transcript for ${talk.title}:`, dispatchError);
      dispatch(setError(`Failed to send transcript for ${talk.title}.`));
    }
  };

  /**
   * Sends the transcript for the first available talk in the search results.
   */
  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    console.log('TalkPanel - Sending first available transcript for query:', query);
    for (let i = 0; i < talks.length; i++) {
      try {
        console.log(`TalkPanel - Attempting to send transcript for talk: ${talks[i].title}`);
        await sendTranscriptForTalk(query, talks[i]);
        return;
      } catch (error) {
        console.error(`TalkPanel - Failed to send transcript for talk: ${talks[i].title}. Error:`, error);
      }
    }
    dispatch(setError('Try searching for a different word.'));
  };

  /**
   * Handles the selection of a new talk.
   * Moves the selected talk to the top of the list and sends its transcript.
   */
  useEffect(() => {
    if (selectedTalk) {
      console.log(`TalkPanel - New talk selected: ${selectedTalk.title}`);

      // Move selected talk to the top
      const updatedTalks = talks.filter((talk) => talk.title !== selectedTalk.title);
      dispatch(setTalks([selectedTalk, ...updatedTalks]));

      // Scroll to the top
      if (scrollableContainerRef.current) {
        scrollableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Ensure transcript is sent only once
      if (!sentMessagesRef.current.has(selectedTalk.title)) {
        sendTranscriptForTalk(searchQuery, selectedTalk);
      } else {
        console.log(`TalkPanel - Transcript already sent for talk: ${selectedTalk.title}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTalk]);

  /**
   * Shuffles the list of talks and updates the state accordingly.
   */
  const shuffleTalks = async () => {
    if (talks.length > 0) {
      const shuffledTalks = shuffleArray([...talks]);
      dispatch(setTalks(shuffledTalks));
      dispatch(setSelectedTalk(shuffledTalks[0] || null));
      await handleSearchResults(searchQuery, shuffledTalks);
    }
  };

  /**
   * Opens the transcript of the selected talk in a new browser tab.
   */
  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      window.open(transcriptUrl, '_blank');
    }
  };

  return (
    <div className={styles.TalkPanel}>
      {/* Iframe for the selected talk */}
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

      {/* Search bar section */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={styles.searchInput}
            placeholder="Search for talks..."
            aria-label="Search for talks"
          />
          {loading && <LoadingSpinner />}
        </div>
        <button
          onClick={() => {
            debouncedPerformSearch.cancel(); // Cancel any pending debounced search
            performSearch(searchQuery);
          }}
          className={`${styles.button} ${styles.searchButton}`}
          disabled={loading}
          aria-label="Search"
        >
          Search
        </button>
        <button
          onClick={shuffleTalks}
          className={`${styles.button} ${styles.shuffleButton}`}
          aria-label="Shuffle talks"
        >
          Shuffle
        </button>
        {selectedTalk && (
          <button
            onClick={openTranscriptInNewTab}
            className={`${styles.button} ${styles.tedButton}`}
            aria-label="Open transcript in new tab"
          >
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
            {talks.map((talk) => (
              <TalkItem key={talk.url} talk={talk} selected={selectedTalk?.title === talk.title} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
