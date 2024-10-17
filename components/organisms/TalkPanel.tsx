// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'store/store';
import axios from 'axios';
import { setTalks, setSelectedTalk } from 'store/talkSlice';
import { setLoading, setApiError } from 'store/apiSlice';
import { sendMessage } from 'store/chatSlice';
import { Talk } from 'types';
import { determineInitialKeyword } from 'components/utils/talkPanelUtils';
import { debounce } from 'lodash';
import TalkItem from './TalkItem';
import LoadingSpinner from './LoadingSpinner';
import styles from 'styles/components/organisms/TalkPanel.module.css';

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { talks, selectedTalk } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState<string>(determineInitialKeyword());

  // Use flags and references to prevent redundant behavior.
  const isSearchInProgress = useRef(false);
  const hasSearchedOnce = useRef(false); // Prevent repeated initial searches
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedPerformSearch = useCallback(
    debounce((query: string) => {
      console.log('Debounced search initiated:', query);
      performSearch(query);
    }, 500),
    []
  );

  // **Initialize search on mount, but guard against Strict Mode remounts.**
  useEffect(() => {
    console.log('TalkPanel - Component mounted. Initializing search...');

    if (!hasSearchedOnce.current) {
      performSearch(searchQuery); // Perform search only once.
      hasSearchedOnce.current = true;
    }

    return () => {
      console.log('Cleaning up tasks on unmount...');
      if (abortControllerRef.current) {
        console.log('Aborting task:', abortControllerRef.current);
        abortControllerRef.current.abort();
      }
      debouncedPerformSearch.cancel();
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    console.log(`Performing search with query: ${query}`);
    const trimmedQuery = query.trim().toLowerCase();

    if (isSearchInProgress.current) {
      console.log('Search in progress. Aborting previous search...');
      abortControllerRef.current?.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    isSearchInProgress.current = true;
    dispatch(setLoading(true));

    try {
      const response = await axios.get(
        `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(trimmedQuery)}`,
        { signal: controller.signal }
      );

      if (response.status !== 200) throw new Error(response.statusText);

      const data: Talk[] = response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));

      console.log('Search results:', data);
      dispatch(setTalks(data));
      if (!selectedTalk && data.length) {
        dispatch(setSelectedTalk(data[0]));
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Search aborted:', error);
      } else {
        console.error('Search failed:', error);
        dispatch(setApiError('Failed to fetch talks.'));
      }
    } finally {
      dispatch(setLoading(false));
      isSearchInProgress.current = false;
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
            title={selectedTalk.title}
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
        <LoadingSpinner loading={isSearchInProgress.current} />
      </div>

      <div className={styles.scrollableContainer}>
        {talks.map((talk) => (
          <TalkItem key={talk.url} talk={talk} selected={selectedTalk?.title === talk.title} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TalkPanel);
