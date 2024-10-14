// File: store/apiSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ApiState {
  isLoading: boolean;
}

const initialState: ApiState = {
  isLoading: false,
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = apiSlice.actions;
export default apiSlice.reducer;
