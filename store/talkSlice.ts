// File: store/talkSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Talk } from 'types';
import { AppDispatch } from './store';
import { setLoading, setApiError, clearApiError } from './apiSlice'; // Import actions from apiSlice

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
      state.searchHistory.push(action.payload);
    },
  },
});

export const { setTalks, setSelectedTalk, addSearchHistory } = talkSlice.actions;
export default talkSlice.reducer;

/**
 * Thunk to fetch talks from an API with centralized loading and error handling.
 */
export const fetchTalks = (query: string) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true)); // Start loading state
  dispatch(clearApiError()); // Clear previous errors

  try {
    const response = await fetch(
      `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`
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

    dispatch(setTalks(talks));
    dispatch(addSearchHistory(query)); // Save the search query to history
  } catch (error: any) {
    console.error('Error fetching talks:', error);
    dispatch(setApiError(error.message || 'An unknown error occurred')); // Set the error state
  } finally {
    dispatch(setLoading(false)); // End loading state
  }
};
