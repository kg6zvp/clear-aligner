import { createSlice, PayloadAction, current } from '@reduxjs/toolkit';
import { Alignment, Link, Corpus, Word } from 'structs';
import removeSegmentFromLink from 'helpers/removeSegmentFromLink';
import generateLinkId from 'helpers/generateLinkId';

export enum AlignmentMode {
  CleanSlate = 'cleanSlate', // Default mode
  Select = 'select', // An existing link has been selected
  Edit = 'edit', // Editing a new or existing link
  PartialEdit = 'partialEdit', // Only one 'side' has been selected
}

export interface AlignmentState {
  alignments: Alignment[];
  inProgressLink: Link | null;
  mode: AlignmentMode;
  corpora: Corpus[];
}

export const initialState: AlignmentState = {
  alignments: [],
  corpora: [],
  inProgressLink: null,
  mode: AlignmentMode.CleanSlate,
};

const createNextLinkId = (alignment: Alignment) => {
  return `${Date.now()}-${generateLinkId(alignment.links)}`;
};

const alignmentSlice = createSlice({
  name: 'alignment',
  initialState,
  reducers: {
    loadAlignments: (state, action: PayloadAction<Alignment[]>) => {
      state.alignments = action.payload.map((alignment) => {
        return {
          ...alignment,
          links: alignment.links.map((link, index) => {
            return {
              ...link,
              id: `${alignment.polarity}-${index}`,
            };
          }),
        };
      });
    },

    toggleTextSegment: (state, action: PayloadAction<Word>) => {
      if (state.inProgressLink?.id === '?') {
        // There is a partial in-progress link.
        if ('sources' === action.payload.side) {
          state.inProgressLink.sources.push(action.payload.id);
        } else if ('targets' === action.payload.side) {
          state.inProgressLink.targets.push(action.payload.id);
        }

        if (
          state.inProgressLink.sources.length !== 0 &&
          state.inProgressLink.targets.length !== 0
        ) {
          state.mode = AlignmentMode.Edit;
          const relatedAlignment = state.alignments.find((_) => true);

          if (!relatedAlignment) {
            throw new Error(
              `Unable to find alignment for proposed link: ${current(
                state.inProgressLink
              )}`
            );
          }
          state.inProgressLink.id = createNextLinkId(relatedAlignment);
        } else if (
          state.inProgressLink.sources.length === 0 ||
          state.inProgressLink.targets.length === 0
        ) {
          state.mode = AlignmentMode.PartialEdit;
        }
        return;
      }

      if (state.inProgressLink) {
        // There is already an in progress link.
        state.mode = AlignmentMode.Edit;

        const alreadyToggled =
          ('sources' === action.payload.side &&
            state.inProgressLink.sources.includes(action.payload.id)) ||
          ('targets' === action.payload.side &&
            state.inProgressLink.targets.includes(action.payload.id));

        if (alreadyToggled) {
          // remove segment from link
          state.inProgressLink = removeSegmentFromLink(
            action.payload,
            state.inProgressLink
          );

          if (
            !(
              state.inProgressLink.sources.length > 0 ||
              state.inProgressLink.targets.length > 0
            )
          ) {
            // if nothing is selected, clear the link
            state.inProgressLink = null;
            state.mode = AlignmentMode.CleanSlate;
          }
        } else {
          // add segment to link
          if (action.payload.side === 'sources') {
            state.inProgressLink.sources.push(action.payload.id);
          }

          if (action.payload.side === 'targets') {
            state.inProgressLink.targets.push(action.payload.id);
          }
        }
      } else {
        // No in progress link.
        // Either create, or load existing link to edit.
        const newInProgressLink = {
          id: '?',
          sources: [] as string[],
          targets: [] as string[],
        };

        const potentialAlignment = state.alignments.find((_) => true);

        if (!potentialAlignment) {
          // No alignments found for text segment.
          throw new Error(
            `No alignment found for selected text segment: ${action.payload.id}, ${action.payload.corpusId}`
          );
        }

        if (potentialAlignment) {
          // Single alignmnent for text segment found.
          const alignment = potentialAlignment;

          const existingLink = alignment.links.find((link: Link) => {
            return (
              (action.payload.side === 'sources' &&
                link.sources.includes(action.payload.id)) ||
              (action.payload.side === 'targets' &&
                link.targets.includes(action.payload.id))
            );
          });

          if (existingLink) {
            // Load the existing link
            state.inProgressLink = {
              id: existingLink.id,
              sources: existingLink.sources,
              targets: existingLink.targets,
            };
            state.mode = AlignmentMode.Select;
            return;
          }

          if (!existingLink) {
            // Initialize partial edit mode.

            newInProgressLink.id = createNextLinkId(alignment);

            switch (action.payload.side) {
              case 'sources':
                newInProgressLink.sources.push(action.payload.id);
                break;
              case 'targets':
                newInProgressLink.targets.push(action.payload.id);
                break;
            }
            state.inProgressLink = newInProgressLink;
            state.mode = AlignmentMode.Edit;
            return;
          }
        }
      }
    },

    resetTextSegments: (state) => {
      state.inProgressLink = null;
      state.mode = AlignmentMode.CleanSlate;
    },

    createLink: (state) => {
      if (state.inProgressLink) {
        const alignment = state.alignments.find((_: Alignment) => true);

        if (!alignment) {
          throw new Error(
            `Could find alignment to update with link: ${state.inProgressLink}`
          );
        }

        let updated = false;
        for (const link of alignment.links) {
          if (link.id === state.inProgressLink.id) {
            link.sources = state.inProgressLink.sources;
            link.targets = state.inProgressLink.targets;
            updated = true;
          }
        }

        if (!updated) {
          alignment.links.push({
            id: state.inProgressLink.id,
            sources: state.inProgressLink.sources,
            targets: state.inProgressLink.targets,
          });
        }

        state.inProgressLink = null;
        state.mode = AlignmentMode.CleanSlate;
      }
    },
    deleteLink: (state) => {
      const inProgressLink = state.inProgressLink;

      if (inProgressLink) {
        const alignmentIndex = state.alignments.findIndex(
          (_: Alignment) => true
        );

        if (Number.isFinite(alignmentIndex)) {
          const linkToDeleteIndex = state.alignments[
            alignmentIndex
          ].links.findIndex((link: Link) => {
            return link.id === inProgressLink.id;
          });

          if (Number.isFinite(linkToDeleteIndex)) {
            state.alignments[alignmentIndex].links.splice(linkToDeleteIndex, 1);
            state.inProgressLink = null;
            state.mode = AlignmentMode.CleanSlate;
          }
        }
      }
    },
  },
});

export const {
  loadAlignments,
  toggleTextSegment,
  resetTextSegments,
  createLink,
  deleteLink,
} = alignmentSlice.actions;

export default alignmentSlice.reducer;
