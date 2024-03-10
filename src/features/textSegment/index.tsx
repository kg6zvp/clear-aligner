import React, { ReactElement, useMemo } from 'react';
import { Typography } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { selectAlignmentMode, toggleTextSegment } from 'state/alignment.slice';
import { hover } from 'state/textSegmentHover.slice';
import { AlignmentSide, LanguageInfo, Word } from 'structs';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AlignmentMode } from '../../state/alignmentState';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';
import { useFindLinksByWord } from '../../state/links/tableManager';

export interface TextSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  word: Word;
  languageInfo?: LanguageInfo;
  showAfter?: boolean;
  alignment?: 'flex-end' | 'flex-start' | 'center';
}

const computeVariant = (
  isSelected: boolean,
  isLinked: boolean
): 'unlinked' | 'selected' | undefined => {
  if (isSelected) {
    return 'selected';
  }
  if (!isLinked) {
    return 'unlinked';
  }
  return undefined;
};

const computeDecoration = (
  readonly: boolean,
  isHovered: boolean,
  isRelated: boolean,
  mode: AlignmentMode,
  isLinked: boolean,
  isInvolved: boolean,
  isMemberOfMultipleAlignments: boolean
): string => {
  let decoration = '';
  if (
    mode === AlignmentMode.Edit ||
    mode === AlignmentMode.Create ||
    mode === AlignmentMode.PartialCreate ||
    mode === AlignmentMode.PartialEdit
  ) {
    if (isLinked) {
      // Prevents previously linked segments being added to other links.
      decoration += ' locked';
    }

    if (!isInvolved) {
      // Prevents segments from not-involved corpora being added to the inProgressLink
      decoration += ' locked';
    }

    return decoration;
  }

  if (isHovered && !readonly) {
    decoration += ' focused';
  }

  if (isRelated) {
    decoration += ' related';
  }

  if (isMemberOfMultipleAlignments) {
    decoration += ' locked';
  }

  return decoration;
};

export const TextSegment = ({
                              readonly,
                              word,
                              languageInfo,
                              onlyLinkIds,
                              alignment,
                              showAfter = false
                            }: TextSegmentProps): ReactElement => {
  useDebug('TextSegmentComponent');

  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectAlignmentMode); // get alignment mode
  const isHovered = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.side === word.side &&
      state.textSegmentHover.hovered?.id === word.id
  );
  const currentlyHovered = useAppSelector(
    (state) => state.textSegmentHover.hovered
  );
  const {
    result: wordLinks
  } = useFindLinksByWord(word.side, BCVWP.parseFromString(word.id), word.id);
  const {
    result: hoveredLinks
  } = useFindLinksByWord(
    currentlyHovered?.side,
    (currentlyHovered?.id ? BCVWP.parseFromString(currentlyHovered?.id) : undefined),
    currentlyHovered?.id);

  const isMemberOfMultipleAlignments = useMemo(
    () => (wordLinks ?? []).length > 1,
    [wordLinks]
  );

  const isSelectedInEditedLink = useAppSelector((state) => {
    switch (word.side) {
      case AlignmentSide.SOURCE:
        return !!state.alignment.present.inProgressLink?.sources.includes(
          BCVWP.sanitize(word.id)
        );
      case AlignmentSide.TARGET:
        return !!state.alignment.present.inProgressLink?.targets.includes(
          BCVWP.sanitize(word.id)
        );
    }
  });

  const isRelatedToCurrentlyHovered = useMemo(
    () => {
      return _.intersection(wordLinks, hoveredLinks).length > 0;
    },
    [wordLinks, hoveredLinks]
  );

  const isLinked = useMemo(
    () => (wordLinks ?? []).length > 0,
    [wordLinks]
  );

  const isInvolved = useAppSelector(
    (state) => !!state.alignment.present.inProgressLink
  );

  if (!word) {
    return <span>{'ERROR'}</span>;
  }

  return (
    <React.Fragment>
      <Typography
        paragraph={false}
        component="span"
        variant={computeVariant(isSelectedInEditedLink, isLinked)}
        sx={alignment ? { display: 'flex', justifyContent: alignment } : {}}
        className={`text-segment${
          readonly ? '.readonly' : ''
        } ${computeDecoration(
          !!readonly,
          isHovered,
          isRelatedToCurrentlyHovered,
          mode,
          isLinked,
          isInvolved,
          isMemberOfMultipleAlignments
        )}`}
        style={{
          ...(languageInfo?.fontFamily
            ? { fontFamily: languageInfo.fontFamily }
            : {})
        }}
        onMouseEnter={
          readonly
            ? undefined
            : () => {
              dispatch(hover(word));
            }
        }
        onMouseLeave={
          readonly
            ? undefined
            : () => {
              dispatch(hover(null));
            }
        }
        onClick={
          readonly
            ? undefined
            : () => dispatch(toggleTextSegment({ foundRelatedLinks: (wordLinks ?? []), word }))
        }
      >
        <LocalizedTextDisplay languageInfo={languageInfo}>
          {word.text}{showAfter ? (word.after || '').trim() : ''}
        </LocalizedTextDisplay>
      </Typography>
    </React.Fragment>
  );
};

export default TextSegment;
