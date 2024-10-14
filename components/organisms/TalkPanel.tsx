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
import { determineInitialKeyword, shuffleArray } from 'components/utils/talkPanelUtils';
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
      console.log('TalkPanel - Initial render, performing search with query:', searchQuery);
      performSearch(searchQuery);
      initialRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchResults = async (query: string, data: Talk[]): Promise<void> => {
    console.log('TalkPanel - handleSearchResults called. Query:', query, 'Results:', data);
    dispatch(setTalks(data));
    dispatch(setSelectedTalk(data[0] || null));

    await sendFirstAvailableTranscript(query, data);
  };

  const performSearch = async (query: string): Promise<void> => {
    console.log('TalkPanel - Performing search for query:', query);
    dispatch(setError(null));
    dispatch(setLoading(true));

    try {
      const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`);
      console.log('TalkPanel - Received response:', response);

      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      let data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));

      console.log('TalkPanel - Mapped response data into talks:', data);
      await handleSearchResults(query, data);

    } catch (error) {
      console.error('TalkPanel - Error during performSearch:', error);
      dispatch(setError('Failed to fetch talks.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const sendFirstAvailableTranscript = async (query: string, talks: Talk[]): Promise<void> => {
    console.log('TalkPanel - sendFirstAvailableTranscript started. Query:', query, 'Talks:', talks);
  
    for (let i = 0; i < talks.length; i++) {
      try {
        const talk = talks[i];
        console.log(`TalkPanel - Processing talk #${i}:`, talk);
  
        const sendTranscript = talk.transcript || 'Transcript not available';
        const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';
  
        console.log(`TalkPanel - Sending message for talk: ${talk.title}, Transcript: ${sendTranscript}, SDG Tag: ${sendSdgTag}`);
  
        // Wrapping the dispatch in try-catch to log any possible errors
        try {
          const result = await dispatch(sendMessage({ text: `${query} | ${talk.title} | ${sendTranscript} | ${sendSdgTag}`, hidden: true }));
          console.log(`TalkPanel - Message dispatched for: ${talk.title}. Dispatch result:`, result);
        } catch (dispatchError) {
          console.error(`TalkPanel - Error dispatching message for: ${talk.title}. Error:`, dispatchError);
          continue; // Move to the next talk if this one fails
        }
  
        dispatch(setSelectedTalk(talk));
        console.log(`TalkPanel - Successfully sent transcript and selected talk for: ${talk.title}`);
        return; // Exit loop once a successful transcript is sent
  
      } catch (error) {
        console.error(`TalkPanel - Failed to process transcript for talk: ${talks[i].title}. Error:`, error);
      }
    }
  
    console.error('TalkPanel - Failed to send transcripts for all talks.');
    dispatch(setError('Failed to send transcripts for all talks.'));
  };  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('TalkPanel - Search input changed. Value:', e.target.value);
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('TalkPanel - Enter key pressed. Performing search.');
      performSearch(searchQuery);
    }
  };

  const shuffleTalks = async () => {
    console.log('TalkPanel - Shuffle button clicked.');
    if (talks.length > 0) {
      const shuffledTalks = shuffleArray([...talks]);
      console.log('TalkPanel - Talks shuffled. New order:', shuffledTalks);
      dispatch(setTalks(shuffledTalks));
      dispatch(setSelectedTalk(shuffledTalks[0] || null));

      await handleSearchResults(searchQuery, shuffledTalks);
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      const transcriptUrl = `${selectedTalk.url}/transcript?subtitle=en`;
      console.log('TalkPanel - Opening transcript in new tab. URL:', transcriptUrl);
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
