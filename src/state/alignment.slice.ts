import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Link, Word } from 'structs';
import { AlignmentMode } from './alignmentState';

export interface AlignmentState {
  inProgressLink: Link | null;
  mode: AlignmentMode;
}

export const initialState: AlignmentState = {
  inProgressLink: null,
  mode: AlignmentMode.CleanSlate,
};

const alignmentSlice = createSlice({
  name: 'alignment',
  initialState,
  reducers: {
    loadInProgressLink: (state, action: PayloadAction<Link>) => {
      state.inProgressLink = action.payload;
    },

    toggleTextSegment: (state, action: PayloadAction<Word>) => {
      if (!state.inProgressLink) {
        state.inProgressLink = {
          sources: [],
          targets: [],
        };
      }
      // There is a partial in-progress link.
      switch (action.payload.side) {
        case 'sources':
          state.inProgressLink.sources.push(action.payload.id);
          break;
        case 'targets':
          state.inProgressLink.targets.push(action.payload.id);
          break;
      }
    },

    resetTextSegments: (state) => {
      state.inProgressLink = null;
      state.mode = AlignmentMode.CleanSlate;
    },
  },
});

export const {
  loadInProgressLink,
  toggleTextSegment,
  resetTextSegments,
} = alignmentSlice.actions;

export default alignmentSlice.reducer;
