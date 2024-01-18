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

export interface TextSegmentProps {
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
      (alignment) => {
        return (
          alignment.source === word.corpusId ||
          alignment.target === word.corpusId
        );
      }
    );
    return relatedAlignments.length > 1;
  });

  const isSelected = Boolean(
    useAppSelector((state) => {
      const alignment = state.alignment.present.alignments.find((_) => true);
      if (!alignment) {
        return false;
      }
      return (
        (state.alignment.present.inProgressLink?.source === word.corpusId &&
          state.alignment.present.inProgressLink?.sources.some((source) => source === word.id)) ||
        (state.alignment.present.inProgressLink?.target === word.corpusId &&
          state.alignment.present.inProgressLink?.targets.some((target) => target === word.id))
      );
    })
  );

  const isInProgressLinkMember = Boolean(
    useAppSelector((state) => {
      return (
        state.alignment.present.inProgressLink?.sources.includes(word.id) ||
        state.alignment.present.inProgressLink?.targets.includes(word.id)
      );
    })
  );

  const isRelated = Boolean(
    useAppSelector((state) => {
      if (word) {
        const relatedAlignment = state.textSegmentHover.relatedAlignments.find(
          (alignment: Alignment) => {
            return (
              alignment.source === word.corpusId ||
              alignment.target === word.corpusId
            );
          }
        );

        const relatedLink = relatedAlignment?.links.filter((link: Link) => {
          return (
            (relatedAlignment.source === word.corpusId &&
              link.sources.includes(word.id)) ||
            (relatedAlignment.target === word.corpusId &&
              link.targets.includes(word.id))
          );
        });

        return Boolean(relatedLink?.length);
      }
    })
  );

  const link = useAppSelector((state) => {
    const inProgressLink = state.alignment.present.inProgressLink;

    const contextualAlignment = state.alignment.present.alignments.find(
      (alignment: Alignment) => {
        if (inProgressLink) {
          return (
            inProgressLink.source === alignment.source &&
            inProgressLink.target === alignment.target
          );
        }
        return false;
      }
    );

    let foundLink = null;

    if (contextualAlignment) {
      if (word) {
        for (const link of contextualAlignment.links) {
          if (
            (contextualAlignment.source === word.corpusId &&
              link.sources.includes(word.id)) ||
            (contextualAlignment.target === word.corpusId &&
              link.targets.includes(word.id))
          ) {
            foundLink = link;
          }
        }
      }
    } else {
      if (word) {
        const possibleAlignments = state.alignment.present.alignments.filter(
          (alignment: Alignment) => {
            return (
              alignment.source === word.corpusId ||
              alignment.target === word.corpusId
            );
          }
        );
        for (const alignment of possibleAlignments) {
          for (const link of alignment.links) {
            if (
              (alignment.source === word.corpusId &&
                link.sources.includes(word.id)) ||
              (alignment.target === word.corpusId &&
                link.targets.includes(word.id))
            ) {
              foundLink = link;
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
    useAppSelector((state) => {
      const inProgressLink = state.alignment.present.inProgressLink;
      if (inProgressLink) {
        return (
          inProgressLink.source === word.corpusId ||
          inProgressLink.target === word.corpusId
        );
      }
    })
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
