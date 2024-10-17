// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { sendMessage } from 'store/chatSlice'; // Import sendMessage action
import { Talk } from 'types';
import { shuffleArray } from 'components/utils/talkPanelUtils';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { debounce } from 'lodash';
import styles from 'styles/components/organisms/TalkPanel.module.css';
import { performSearch } from 'components/utils/apiUtils';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState('');
  const isSearchInProgress = useRef(false); 
  const hasSearchedOnce = useRef(false); 
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounced search to optimize API calls
  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      dispatch(performSearch(query));
    }, 500),
    [dispatch]
  );

  // Ensure the initial search only runs once
  useEffect(() => {
    if (!hasSearchedOnce.current) {
      console.log('Component mounted. Performing initial search...');
      debouncedPerformSearch(searchQuery);
      hasSearchedOnce.current = true;
    }

    return () => {
      console.log('Cleaning up tasks on unmount...');
      debouncedPerformSearch.cancel();
    };
  }, [searchQuery, debouncedPerformSearch]);

  const handleSearchResults = (data: Talk[]) => {
    console.log('Handling search results:', data);
    const uniqueTalks = shuffleArray(data).filter(
      (newTalk) => !talks.some((existingTalk) => existingTalk.url === newTalk.url)
    );

    dispatch(setTalks(uniqueTalks));

    if (uniqueTalks.length > 0) {
      const firstTalk = uniqueTalks[0];
      dispatch(setSelectedTalk(firstTalk));

      // Send the first talk's data as a message
      dispatch(sendMessage({ text: `Selected talk: ${firstTalk.title}`, hidden: false }));
      console.log('Message sent with talk details:', firstTalk.title);
    }
  };

  const openTranscriptInNewTab = () => {
    if (selectedTalk) {
      console.log(`Opening transcript for ${selectedTalk.title}`);
      window.open(`${selectedTalk.url}/transcript?subtitle=en`, '_blank');
    }
  };

  const shuffleTalks = () => {
    const shuffledTalks = shuffleArray(talks);
    console.log('Shuffled talks:', shuffledTalks);
    dispatch(setTalks(shuffledTalks));
  };

  return (
    <div className={styles.TalkPanel}>
      {selectedTalk && (
        <div className={styles.nowPlaying}>
          <iframe
            src={`https://embed.ted.com/talks/${selectedTalk.url.match(/talks\/([\w_]+)/)?.[1]}`}
            width="100%"
            height="400"
            allow="autoplay; fullscreen; encrypted-media"
            className={styles.videoFrame}
            title={`${selectedTalk.title} video`}
          />
        </div>
      )}

      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && debouncedPerformSearch(searchQuery)}
          className={styles.searchInput}
          placeholder="Search for talks..."
        />
        {loading && <LoadingSpinner />}
      </div>

      {error && <div>{error}</div>}

      <div className={styles.scrollableContainer} ref={scrollableContainerRef}>
        {talks.map((talk, index) => (
          <TalkItem
            key={`${talk.url}-${index}`}
            talk={talk}
            selected={selectedTalk?.title === talk.title}
          />
        ))}
      </div>

      <button onClick={shuffleTalks} className={styles.button}>
        Shuffle Talks
      </button>

      {selectedTalk && (
        <button onClick={openTranscriptInNewTab} className={styles.button}>
          View Transcript
        </button>
      )}
    </div>
  );
};

export default React.memo(TalkPanel);
