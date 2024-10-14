// File: store/notificationSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  message: string | null;
  type: 'info' | 'error' | 'warning';
}

const initialState: NotificationState = {
  message: null,
  type: 'info',
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification: (
      state,
      action: PayloadAction<{ message: string; type: 'info' | 'error' | 'warning' }>
    ) => {
      state.message = action.payload.message;
      state.type = action.payload.type;
    },
    hideNotification: (state) => {
      state.message = null;
    },
  },
});

// Destructure and export actions
export const { showNotification, hideNotification } = notificationSlice.actions;

// Export reducer
export default notificationSlice.reducer;
