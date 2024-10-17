// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import { performSearch, debouncedPerformSearch } from 'components/utils/apiUtils';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import { Talk } from 'types';
import { shuffleArray } from 'components/utils/talkPanelUtils';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);
  const { loading, error } = useSelector((state: RootState) => state.api);

  const [searchQuery, setSearchQuery] = useState<string>('SDG');
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSearchedOnce = useRef(false);

  useEffect(() => {
    console.log('Component mounted. Performing initial search...');

    if (!hasSearchedOnce.current) {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      dispatch(performSearch(searchQuery, controller.signal));
      hasSearchedOnce.current = true;
    }

    return () => {
      console.log('Cleaning up tasks on unmount...');
      abortControllerRef.current?.abort();
      debouncedPerformSearch.cancel();
    };
  }, [dispatch, searchQuery]);

  const handleSearch = () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    debouncedPerformSearch(searchQuery, dispatch, controller.signal);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
            placeholder="Search for talks..."
          />
          {loading && <LoadingSpinner />}
        </div>
        <button
          onClick={handleSearch}
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

      {error && <div className={styles.errorContainer}>{error}</div>}

      <div className={styles.scrollableContainer}>
        {talks.map((talk, index) => (
          <TalkItem
            key={`${talk.url}-${index}`}
            talk={talk}
            selected={selectedTalk?.title === talk.title}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
