// File: store/talkSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Talk } from 'types';

interface TalkState {
  talks: Talk[];
  selectedTalk: Talk | null;
  searchHistory: string[];
  error: string | null;
  loading: boolean;
}

const initialState: TalkState = {
  talks: [],
  selectedTalk: null,
  searchHistory: [],
  error: null,
  loading: false,
};

// Utility function to save talks and selectedTalk to localStorage
const saveToLocalStorage = (talks: Talk[], selectedTalk: Talk | null) => {
  try {
    localStorage.setItem('cachedTalk', JSON.stringify({ talks, selectedTalk }));
  } catch (error) {
    console.error('Error saving to localStorage', error);
  }
};

// Utility function to load talks from localStorage
const loadFromLocalStorage = (): { talks: Talk[]; selectedTalk: Talk | null } | null => {
  try {
    const cachedData = localStorage.getItem('cachedTalk');
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('Error loading from localStorage', error);
    return null;
  }
};

const talkSlice = createSlice({
  name: 'talk',
  initialState,
  reducers: {
    setTalks: (state, action: PayloadAction<Talk[]>) => {
      state.talks = action.payload;
      saveToLocalStorage(state.talks, state.selectedTalk);
    },
    setSelectedTalk: (state, action: PayloadAction<Talk | null>) => {
      state.selectedTalk = action.payload;
      saveToLocalStorage(state.talks, state.selectedTalk);
    },
    addSearchHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory.push(action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// Optionally, load initial state from localStorage
const persistedState = loadFromLocalStorage();
if (persistedState) {
  initialState.talks = persistedState.talks;
  initialState.selectedTalk = persistedState.selectedTalk;
}

export const { setTalks, setSelectedTalk, addSearchHistory, setError, setLoading } = talkSlice.actions;
export default talkSlice.reducer;
