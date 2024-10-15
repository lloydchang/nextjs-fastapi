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
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setTalks, setSelectedTalk, addSearchHistory, setError, setLoading } = talkSlice.actions;
export default talkSlice.reducer;
