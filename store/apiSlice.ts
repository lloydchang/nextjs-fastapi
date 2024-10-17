// File: store/apiSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ApiState {
  isLoading: boolean;
  error: string | null; // Track errors globally for API calls
}

const initialState: ApiState = {
  isLoading: false,
  error: null,
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setApiError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload; // Store error messages for API issues
    },
    clearApiError: (state) => {
      state.error = null;
    },
  },
});

export const { setLoading, setApiError, clearApiError } = apiSlice.actions;
export default apiSlice.reducer;
