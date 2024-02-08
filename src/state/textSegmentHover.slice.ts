import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Link, Word } from 'structs';

interface TextSegmentState {
  hovered: Word | null;
  relatedLinks: Link[];
}

const initialState: TextSegmentState = {
  hovered: null,
  relatedLinks: [],
};

const textSegmentHoverSlice = createSlice({
  name: 'textSegmentHover',
  initialState,
  reducers: {
    hover: (state, action: PayloadAction<Word | null>) => {
      state.hovered = action.payload;
    },
    relatedLinks: (state, action: PayloadAction<Link[]>) => {
      state.relatedLinks = action.payload;
    },
  },
});

export const { hover, relatedLinks } = textSegmentHoverSlice.actions;
export default textSegmentHoverSlice.reducer;
