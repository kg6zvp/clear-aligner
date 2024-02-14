import React, { ReactElement, useContext, useEffect, useMemo } from 'react';
import { Typography } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { selectAlignmentMode, toggleTextSegment } from 'state/alignment.slice';
import { hover, relatedLinks } from 'state/textSegmentHover.slice';
import { Word, LanguageInfo } from 'structs';
import findRelatedAlignments from 'helpers/findRelatedAlignments';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import { AlignmentMode } from '../../state/alignmentState';
import { useRelatedLinks } from './useRelatedLinks';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';

export interface TextSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  word: Word;
  languageInfo?: LanguageInfo;
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
  if (mode === AlignmentMode.Edit || mode === AlignmentMode.Create) {
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
}: TextSegmentProps): ReactElement => {
  useDebug('TextSegmentComponent');

  const dispatch = useAppDispatch();
  const { projectState } = useContext(AppContext);

  const mode = useAppSelector(selectAlignmentMode); // get alignment mode

  const isHovered = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.side === word.side &&
      state.textSegmentHover.hovered?.id === word.id
  );

  const currentlyHovered = useAppSelector((state) => state.textSegmentHover.hovered);

  const foundRelatedLinks = useRelatedLinks(word);

  const isMemberOfMultipleAlignments = useMemo(() => foundRelatedLinks.length > 1,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foundRelatedLinks.length])

  /**
   * is member of persisted link
   */
  const isSelected = useMemo(() => {
    const filteredResults = onlyLinkIds ? foundRelatedLinks.filter((link) => onlyLinkIds!.includes(link.id!)) : foundRelatedLinks;
    return filteredResults.length > 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState.linksTable, foundRelatedLinks, onlyLinkIds]);

  const hoverRelatedLinks = useRelatedLinks(currentlyHovered); // links related to the hovered word
  const isRelatedToCurrentlyHovered = useMemo(() => {
    return _.intersection(foundRelatedLinks, hoverRelatedLinks).length > 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hoverRelatedLinks, hoverRelatedLinks.length, foundRelatedLinks, foundRelatedLinks.length]);

  const isLinked = useMemo(() => foundRelatedLinks.length > 0, [ foundRelatedLinks.length ]);

  const isInvolved = useAppSelector((state) => !!state.alignment.present.inProgressLink);

  // print state
  useEffect(() => {
    console.log(`state ${word.side}\n '${BCVWP.parseFromString(word.id).toHumanReadableString()}'`, {
      readonly,
      isHovered,
      isRelatedToCurrentlyHovered,
      mode,
      isLinked,
      isInvolved,
      isMemberOfMultipleAlignments
    });
  }, [
    word.id, word.side,
    readonly,
    isHovered,
    isRelatedToCurrentlyHovered,
    mode,
    isLinked,
    isInvolved,
    isMemberOfMultipleAlignments
  ]);

  if (!word) {
    return <span>{'ERROR'}</span>;
  }
  return (
    <React.Fragment>
      <Typography
        paragraph={false}
        component="span"
        variant={computeVariant(isSelected, isLinked)}
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
            : {}),
        }}
        onMouseEnter={
          readonly
            ? undefined
            : () => {
                dispatch(hover(word));
                findRelatedAlignments(word, projectState.linksTable)
                  .then((links) => {
                    dispatch(relatedLinks(links))
                  });
              }
        }
        onMouseLeave={
          readonly
            ? undefined
            : () => {
                dispatch(hover(null));
                dispatch(relatedLinks([]));
              }
        }
        onClick={
          readonly
            ? undefined
            : () => dispatch(toggleTextSegment({ foundRelatedLinks, word }))
        }
      >
        <LocalizedTextDisplay languageInfo={languageInfo}>
          {word.text}
        </LocalizedTextDisplay>
      </Typography>
    </React.Fragment>
  );
};

export default TextSegment;
