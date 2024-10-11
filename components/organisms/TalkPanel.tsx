// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import axios from 'axios';
import { RootState, AppDispatch } from 'store/store'; // Ensure AppDispatch is imported for typed dispatch
import { setTalks, setSelectedTalk, setError, setLoading } from 'store/talkSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { sdgTitleMap } from 'components/constants/sdgTitles';
import { determineInitialKeyword, shuffleArray, scrapeTranscript } from 'components/utils/talkPanelUtils';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const initialRender = useRef(true);

  // Perform an initial search when the component mounts
  useEffect(() => {
    if (initialRender.current) {
      performSearch(searchQuery);
      initialRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles search results, dispatches the talks and attempts to send the first transcript.
   * @param query - The original search query.
   * @param data - The array of fetched talks.
   */
  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    dispatch(setTalks(data));
    dispatch(setSelectedTalk(data[0] || null));

    // Attempt to send the transcript of the first available talk to the chat
    await sendFirstAvailableTranscript(query, data);
  };

  /**
   * Performs the search based on the query and dispatches results.
   * @param query - The search query.
   */
  const performSearch = async (query: string): Promise<void> => {
    dispatch(setError(null));
    dispatch(setLoading(true));

    try {
      const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`);
      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      // Map the results into Talk objects
      let data: Talk[] = response.data.results.map((result: any) => ({
        title: result.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.slug}`,
        sdg_tags: result.sdg_tags || [],
      }));

      // Handle search results in a separate function
      await handleSearchResults(query, data);
      
    } catch (error) {
      console.error(error);
      dispatch(setError("Failed to fetch talks."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Tries to scrape and send the transcript of the first available talk.
   * If the first one fails, it will try the next one.
   * @param query - The original search query.
   * @param talks - The array of fetched talks.
   */
  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    for (let i = 0; i < talks.length; i++) {
      try {
        const transcriptUrl = `${talks[i].url}/transcript?subtitle=en`;
        const sendTranscript = await scrapeTranscript(transcriptUrl);
        const sendSdgTag = talks[i].sdg_tags.length > 0 ? sdgTitleMap[talks[i].sdg_tags[0]] : ''; // No SDG Tag

        dispatch(sendMessage({ text: `${query} | ${talks[i].title} | ${sendTranscript} | ${sendSdgTag}`, hidden: true }));
        dispatch(setSelectedTalk(talks[i])); // Set the current successful talk as the selected one
        return; // Exit loop once a successful transcript is fetched
      } catch (error) {
        console.error(`Failed to fetch transcript for ${talks[i].title}. Trying the next one...`);
      }
    }
    dispatch(setError("Failed to fetch transcripts for all talks."));
  };

  /**
   * Handles input change for the search query.
   * @param e - The change event.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handles "Enter" key press to trigger search.
   * @param e - The keyboard event.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  /**
   * Shuffles the current talks and attempts to send the transcript of the first available talk.
   */
  const shuffleTalks = async () => {
    if (talks.length > 0) {
      const shuffledTalks = shuffleArray([...talks]);
      dispatch(setTalks(shuffledTalks));
      dispatch(setSelectedTalk(shuffledTalks[0] || null));

      // Handle shuffled results in the same way as search results
      await handleSearchResults(searchQuery, shuffledTalks);
    }
  };

  /**
   * Opens the transcript in a new tab for the selected talk.
   */
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
            placeholder="Search talks…"
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
