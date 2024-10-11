// File: components/organisms/TalkPanel.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import SDGWheel from 'public/images/SDGWheel.png';
import styles from 'styles/components/organisms/TalkPanel.module.css';
import axios from 'axios';
import fetch from 'node-fetch';
import { RootState, AppDispatch } from 'store/store'; // Ensure AppDispatch is imported for typed dispatch
import { setTalks, setSelectedTalk, setError, setLoading } from 'store/talkSlice';
import { saveMessage, sendMessage } from 'store/chatSlice'; // Updated action names
import { Talk } from 'components/state/types';

// Define a mapping for SDG titles
const sdgTitleMap: Record<string, string> = {
  sdg1: 'SDG 1: No Poverty',
  sdg2: 'SDG 2: Zero Hunger',
  sdg3: 'SDG 3: Good Health and Well-Being',
  sdg4: 'SDG 4: Quality Education',
  sdg5: 'SDG 5: Gender Equality',
  sdg6: 'SDG 6: Clean Water and Sanitation',
  sdg7: 'SDG 7: Affordable and Clean Energy',
  sdg8: 'SDG 8: Decent Work and Economic Growth',
  sdg9: 'SDG 9: Industry, Innovation, and Infrastructure',
  sdg10: 'SDG 10: Reduced Inequalities',
  sdg11: 'SDG 11: Sustainable Cities and Communities',
  sdg12: 'SDG 12: Responsible Consumption and Production',
  sdg13: 'SDG 13: Climate Action',
  sdg14: 'Life Below Water',
  sdg15: 'Life on Land',
  sdg16: 'SDG 16: Peace, Justice, and Strong Institutions',
  sdg17: 'SDG 17: Partnerships for the Goals',
};

// Determine an initial search keyword randomly from predefined options
const determineInitialKeyword = (): string => {
  const keywords = [
    'poverty', 'hunger', 'health', 'education', 'gender',
    'water', 'energy', 'work', 'industry', 'inequality',
    'city', 'consumption', 'climate', 'ocean', 'land', 'peace', 'partnership'
  ];
  const randomIndex = Math.floor(Math.random() * keywords.length);
  return keywords[randomIndex];
};

// Fisher-Yates shuffle algorithm to randomize the order of results
const shuffleArray = (array: any[]): any[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Function to fetch and scrape the processed transcript from a given URL
const scrapeTranscript = async (transcriptUrl: string): Promise<string> => {
  try {
    const response = await fetch(`/api/proxyTranscript?transcriptUrl=${encodeURIComponent(transcriptUrl)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transcript || ''; // '' = Failed to retrieve transcript.
  } catch (error) {
    console.error(`Error scraping transcript from URL ${transcriptUrl}: ${error}`);
    return 'Failed to retrieve transcript.';
  }
};

const TalkPanel: React.FC = () => {
  const dispatch: AppDispatch = useDispatch(); // Use the AppDispatch type to get the correct dispatch function
  const { talks, selectedTalk, error, loading } = useSelector((state: RootState) => state.talk);

  const [searchQuery, setSearchQuery] = useState(determineInitialKeyword());
  const initialRender = useRef(true);

  // Perform an initial search when the component mounts
  useEffect(() => {
    if (initialRender.current) {
      performSearch(searchQuery);
      initialRender.current = false;
    }
  }, []);

  // Function to perform the search based on the query and dispatch results
  const performSearch = async (searchQuery: string): Promise<void> => {
    dispatch(setError(null));
    dispatch(setLoading(true));

    try {
      const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      // Map the results into Talk objects and shuffle them
      let data: Talk[] = response.data.results.map((result: any) => ({
        title: result.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.slug}`,
        sdg_tags: result.sdg_tags || [],
      }));

      data = shuffleArray(data);

      dispatch(setTalks(data));
      dispatch(setSelectedTalk(data[0] || null));

      // Send the scraped transcript of the first talk to the chat
      if (data.length > 0) {
        const sendSearchQuery = searchQuery;
        const firstTalk = data[0];
        const sendTitle = `${firstTalk.title}`;
        const transcriptUrl = `${firstTalk.url}/transcript?subtitle=en`;
        const sendTranscript = await scrapeTranscript(transcriptUrl);
        const sendSdgTag = firstTalk.sdg_tags.length > 0 ? sdgTitleMap[firstTalk.sdg_tags[0]] : ''; // No SDG Tag

        // Use typed dispatch for sendMessage without id
        dispatch(sendMessage({ text: `${sendSearchQuery}`, hidden: true }));
        dispatch(sendMessage({ text: `${sendTitle}`, hidden: true }));
        dispatch(sendMessage({ text: `${sendTranscript}`, hidden: true }));
        dispatch(sendMessage({ text: `${sendSdgTag}`, hidden: true }));
      }
    } catch (error) {
      dispatch(setError("Failed to fetch talks."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className={`${styles.TalkPanel}`}>
      {/* ...remaining component code... */}
    </div>
  );
};

export default React.memo(TalkPanel);
