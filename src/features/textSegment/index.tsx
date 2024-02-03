import React, { ReactElement } from 'react';
import { Typography } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { toggleTextSegment, AlignmentMode } from 'state/alignment.slice';
import { hover, relatedAlignments } from 'state/textSegmentHover.slice';
import { Alignment, Word, Link, LanguageInfo } from 'structs';
import findRelatedAlignments from 'helpers/findRelatedAlignments';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';

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
  if (mode === AlignmentMode.Edit || mode === AlignmentMode.Select) {
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

  const alignments = useAppSelector((state) => {
    return state.alignment.present.alignments;
  });

  const mode = useAppSelector((state) => {
    return state.alignment.present.mode;
  });

  const isHovered = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.id === word.id &&
      state.textSegmentHover.hovered?.corpusId === word.corpusId
  );

  const isMemberOfMultipleAlignments = useAppSelector((state) => {
    const relatedAlignments = state.alignment.present.alignments.filter(
      (_) => true
    );
    return relatedAlignments.length > 1;
  });

  const isSelected = Boolean(
    useAppSelector((state) => {
      return (
        (word.side === 'sources' &&
          state.alignment.present.inProgressLink?.sources.some(
            (source) => source === word.id
          )) ||
        (word.side === 'targets' &&
          state.alignment.present.inProgressLink?.targets.some(
            (target) => target === word.id
          ))
      );
    })
  );

  const isInProgressLinkMember = Boolean(
    useAppSelector((state) => {
      return (
        (word.side === 'sources' &&
          state.alignment.present.inProgressLink?.sources.includes(word.id)) ||
        (word.side === 'targets' &&
          state.alignment.present.inProgressLink?.targets.includes(word.id))
      );
    })
  );

  const isRelated = Boolean(
    useAppSelector((state) => {
      if (word) {
        const relatedAlignment = state.textSegmentHover.relatedAlignments.find(
          (_: Alignment) => true
        );

        const relatedLink = relatedAlignment?.links.filter((link: Link) => {
          if (onlyLinkIds && link.id && !onlyLinkIds.includes(link.id)) {
            return false;
          }
          return (
            (word.side === 'sources' && link.sources.includes(word.id)) ||
            (word.side === 'targets' && link.targets.includes(word.id))
          );
        });

        return Boolean(relatedLink?.length);
      }
    })
  );

  const link = useAppSelector((state) => {
    const inProgressLink = state.alignment.present.inProgressLink;

    const contextualAlignment = state.alignment.present.alignments.find(
      (_: Alignment) => !!inProgressLink
    );

    let foundLink = null;

    if (contextualAlignment) {
      if (word) {
        for (const link of contextualAlignment.links) {
          if (
            (word.side === 'sources' && link.sources.includes(word.id)) ||
            (word.side === 'targets' && link.targets.includes(word.id))
          ) {
            if (!onlyLinkIds || !link.id || onlyLinkIds.includes(link.id)) {
              foundLink = link;
            }
          }
        }
      }
    } else {
      if (word) {
        const possibleAlignments = state.alignment.present.alignments.filter(
          (_: Alignment) => true
        );
        for (const alignment of possibleAlignments) {
          for (const link of alignment.links) {
            if (
              (word.side === 'sources' && link.sources.includes(word.id)) ||
              (word.side === 'targets' && link.targets.includes(word.id))
            ) {
              if (!onlyLinkIds || !link.id || onlyLinkIds.includes(link.id)) {
                foundLink = link;
              }
            }
          }
        }
      }
    }
    return foundLink;
  });

  const isLinked = Boolean(link);

  const mightBeWorkingOnLink = Boolean(
    useAppSelector((state) => {
      const inProgressLink = state.alignment.present.inProgressLink;

      if (inProgressLink && link) {
        const sourcesIntersection = link.sources.filter((sourceId) => {
          return inProgressLink.sources.includes(sourceId);
        });
        const targetsIntersection = link.targets.filter((targetId) => {
          return inProgressLink.targets.includes(targetId);
        });

        return sourcesIntersection.length > 0 || targetsIntersection.length > 0;
      }
    })
  );

  const isCurrentLinkMember = mightBeWorkingOnLink || isInProgressLinkMember;

  const isInvolved = Boolean(
    useAppSelector((state) => !!state.alignment.present.inProgressLink)
  );

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
          isRelated,
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
                dispatch(
                  relatedAlignments(findRelatedAlignments(alignments, word))
                );
              }
        }
        onMouseLeave={
          readonly
            ? undefined
            : () => {
                dispatch(hover(null));
                dispatch(relatedAlignments([]));
              }
        }
        onClick={
          readonly
            ? undefined
            : () => {
                const editOrSelect =
                  [AlignmentMode.Edit, AlignmentMode.Select].includes(mode) &&
                  (!isLinked || isCurrentLinkMember) &&
                  isInvolved;
                const unLinkedEdit =
                  mode === AlignmentMode.PartialEdit && !isLinked;
                const cleanSlate = mode === AlignmentMode.CleanSlate;

                if (editOrSelect || unLinkedEdit || cleanSlate) {
                  dispatch(toggleTextSegment(word));
                }
              }
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
