import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Link, Word } from 'structs';
import { AlignmentMode } from './alignmentState';
import { AppState } from './app.slice';
import { TextSegmentState } from './textSegmentHover.slice';
import { StateWithHistory } from 'redux-undo';

export interface AlignmentState {
  inProgressLink: Link | null;
}

export const initialState: AlignmentState = {
  inProgressLink: null,
};

export const selectAlignmentMode = (state: {
  app: AppState,
  alignment: StateWithHistory<AlignmentState>,
  textSegmentHover: TextSegmentState
}): AlignmentMode => {
  const { inProgressLink } = state.alignment.present;
  if (!inProgressLink) {
    return AlignmentMode.CleanSlate;
  }
  if (inProgressLink.id) { // edit
    if (inProgressLink.sources.length > 0 && inProgressLink.targets.length > 0) {
      return AlignmentMode.Edit;
    }
    return AlignmentMode.PartialEdit;
  } else { // create
    if (inProgressLink.sources.length > 0 && inProgressLink.targets.length > 0) {
      return AlignmentMode.Create;
    }
    return AlignmentMode.PartialCreate;
  }
}

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
          if (state.inProgressLink.sources.includes(action.payload.id)) {
            state.inProgressLink.sources.splice(state.inProgressLink.sources.indexOf(action.payload.id), 1);
          } else {
            state.inProgressLink.sources.push(action.payload.id);
          }
          break;
        case 'targets':
          if (state.inProgressLink.targets.includes(action.payload.id)) {
            state.inProgressLink.targets.splice(state.inProgressLink.targets.indexOf(action.payload.id), 1);
          } else {
            state.inProgressLink.targets.push(action.payload.id);
          }
          break;
      }
    },

    resetTextSegments: (state) => {
      state.inProgressLink = null;
    },
  },
});

export const {
  loadInProgressLink,
  toggleTextSegment,
  resetTextSegments,
} = alignmentSlice.actions;

export default alignmentSlice.reducer;
