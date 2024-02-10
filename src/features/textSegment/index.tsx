import React, { ReactElement, useContext, useEffect, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import useDebug from 'hooks/useDebug';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { selectAlignmentMode, toggleTextSegment } from 'state/alignment.slice';
import { hover, relatedLinks } from 'state/textSegmentHover.slice';
import { Word, Link, LanguageInfo } from 'structs';
import findRelatedAlignments from 'helpers/findRelatedAlignments';

import './textSegment.style.css';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import { AlignmentMode } from '../../state/alignmentState';
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

  const [ isMemberOfMultipleAlignments, setIsMemberOfMultipleAlignments ] = useState(false);

  const [ isSelected, setIsSelected ] = useState(false);

  const [ isRelated, setIsRelated ] = useState(false);

  const inProgressLink = useAppSelector((state) => state.alignment.present.inProgressLink);

  const [ links, setLinks ] = useState([] as Link[]);

  const wordBook = useMemo(() =>
    BCVWP.parseFromString(word.id).book,
    [word.id]);

  const mode = useAppSelector(selectAlignmentMode);

  useEffect(() => {
    if (!projectState.linksTable || !wordBook) {
      return;
    }

    projectState.linksTable
      .query(word.side === 'sources' ? SourceBookIndex : TargetBookIndex, {
        key: String(wordBook),
        include_docs: true
      })
      .then((value) => {
        setLinks(value.rows
          .map((link) => link as unknown as Link)
          .filter((link) =>
            word.side === 'sources' ? link.sources.includes(word.id) : link.targets.includes(word.id)));
      });
  }, [links, setLinks, onlyLinkIds, projectState.linksTable, wordBook, word.id, word.side]);

  useEffect(() => {
    if (!projectState.linksTable) {
      return;
    }

    projectState.linksTable
      .query(word.side === 'sources' ? SourcesIndex : TargetsIndex, { key: word.id })
      .then((result) => {
        setIsMemberOfMultipleAlignments(result.rows.length > 1);
      });
  }, [projectState.linksTable, setIsMemberOfMultipleAlignments, word.side, word.id]);

  const isHovered = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.id === word.id &&
      state.textSegmentHover.hovered?.corpusId === word.corpusId
  );

  useEffect(() => {
    if (!projectState.linksTable) {
      return;
    }

    projectState.linksTable
      .query(word.side === 'sources' ? SourcesIndex : TargetsIndex, { key: word.id })
      .then((result) => {
        setIsSelected(result.rows.length > 0);
      });
  }, [projectState.linksTable, setIsSelected, word.side, word.id]);

  const isInProgressLinkMember = useMemo(() =>
        (word.side === 'sources' &&
          inProgressLink?.sources.includes(word.id)) ||
        (word.side === 'targets' &&
          inProgressLink?.targets.includes(word.id)),
    [inProgressLink, word]);

  useEffect(() => {
    if (!projectState.linksTable) {
      return;
    }

    projectState.linksTable
      .query(word.side === 'sources' ? SourcesIndex : TargetsIndex, { key: word.id, include_docs: true })
      .then((result) => {
        return result.rows
          .map((link) => link.doc as unknown as Link)
          .filter((v) =>
            (!onlyLinkIds || !v.id || onlyLinkIds.includes(v.id)))?.length > 0
      });
  }, [projectState.linksTable, setIsRelated, onlyLinkIds, word.side, word.id]);

  const isCurrentLinkMember = useMemo(() => /*mightBeWorkingOnLink ||*/ isInProgressLinkMember, [/*mightBeWorkingOnLink,*/ isInProgressLinkMember]);

  const isInvolved = useMemo(() => !!inProgressLink, [inProgressLink]);

  if (!word) {
    return <span>{'ERROR'}</span>;
  }
  return (
    <React.Fragment>
      <Typography
        paragraph={false}
        component="span"
        variant={computeVariant(isSelected, /*!!link*/ false)}
        className={`text-segment${
          readonly ? '.readonly' : ''
        } ${computeDecoration(
          !!readonly,
          isHovered,
          isRelated,
          mode,
          /*!!link,*/ false,
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
                findRelatedAlignments(projectState, word, (links) => {
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
            : () => {
                const editOrCreate =
                  [AlignmentMode.Edit, AlignmentMode.Create].includes(mode) &&
                  (/*!link*/ true || isCurrentLinkMember) &&
                  isInvolved;
                const unLinkedEdit =
                  mode === AlignmentMode.PartialEdit && /*!link*/ true;
                const cleanSlate = mode === AlignmentMode.CleanSlate;

                if (editOrCreate || unLinkedEdit || cleanSlate) {
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
