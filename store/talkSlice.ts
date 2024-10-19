// File: store/talkSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Talk } from 'types';
import { AppDispatch } from './store';
import { setLoading, setApiError, clearApiError } from './apiSlice'; // Import API actions

interface TalkState {
  talks: Talk[];
  selectedTalk: Talk | null;
  searchHistory: string[];
}

const initialState: TalkState = {
  talks: [],
  selectedTalk: null,
  searchHistory: [],
};

const talkSlice = createSlice({
  name: 'talk',
  initialState,
  reducers: {
    setTalks: (state, action: PayloadAction<Talk[]>) => {
      state.talks = action.payload;
    },
    setSelectedTalk: (state, action: PayloadAction<Talk | null>) => {
      state.selectedTalk = action.payload;
    },
    addSearchHistory: (state, action: PayloadAction<string>) => {
      // Avoid duplicate entries in the search history
      if (!state.searchHistory.includes(action.payload)) {
        state.searchHistory.push(action.payload);
      }
    },
  },
});

export const { setTalks, setSelectedTalk, addSearchHistory } = talkSlice.actions;
export default talkSlice.reducer;

/**
 * Thunk to fetch talks from an API with centralized loading and error handling.
 * This ensures consistent state management across the app.
 */
export const fetchTalks = (query: string) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true)); // Start loading state
  dispatch(clearApiError()); // Clear any previous error messages

  try {
    const response = await fetch(
      `${searchApiUrl}?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const talks: Talk[] = data.results.map((result: any) => ({
      title: result.document.slug.replace(/_/g, ' '),
      url: `https://www.ted.com/talks/${result.document.slug}`,
      sdg_tags: result.document.sdg_tags || [],
      transcript: result.document.transcript || 'Transcript not available',
    }));

    console.log('Fetched Talks:', talks);

    dispatch(setTalks(talks));
    dispatch(addSearchHistory(query)); // Track successful queries
    if (talks.length > 0) {
      dispatch(setSelectedTalk(talks[0])); // Automatically select the first talk
    }
  } catch (error: any) {
    console.error('Error fetching talks:', error);
    dispatch(setApiError(error.message || 'An unknown error occurred')); // Store error in state
  } finally {
    dispatch(setLoading(false)); // End loading state
  }
};
