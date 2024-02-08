import { RootState } from 'test/harness';
import { AlignmentMode } from '../state/alignmentState';

const preloadedState: RootState = {
  app: { debug: false, theme: 'day', corpusViewports: [], scrollLock: false },
  alignment: {
    past: [],
    present: {
      inProgressLink: null,
      mode: AlignmentMode.CleanSlate,
    },
    future: [],
    group: null,
    _latestUnfiltered: {
      inProgressLink: null,
      mode: AlignmentMode.CleanSlate,
    },
    index: 0,
    limit: 1,
  },
  textSegmentHover: { hovered: null, relatedLinks: [] },
};

export default preloadedState;
