import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppMode } from '../components/Navbar';

interface UiState {
  currentMode: AppMode;
  selectedOutletId: string | null;
}

const initialState: UiState = {
  currentMode: 'hq-overview',
  selectedOutletId: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentMode: (state, action: PayloadAction<AppMode>) => {
      state.currentMode = action.payload;
    },
    setSelectedOutletId: (state, action: PayloadAction<string | null>) => {
      state.selectedOutletId = action.payload;
    },
  },
});

export const { setCurrentMode, setSelectedOutletId } = uiSlice.actions;
export default uiSlice.reducer;
