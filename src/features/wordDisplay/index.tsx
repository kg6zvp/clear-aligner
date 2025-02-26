/**
 * This file contains the WordDisplay component which is used in the VerseDisplay
 * component. It accepts props from VerseDisplay that customize how the text
 * is displayed to the user.
 */
import { Corpus, Link, Word } from '../../structs';
import { Typography } from '@mui/material';
import TextSegment from '../textSegment';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React, { useMemo } from 'react';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import uuid from 'uuid-random';
import { ButtonWord } from './buttonWord';

/**
 * used for expressing which variant of the {@link WordDisplay component should be shown}
 */
export enum WordDisplayVariant {
  TEXT = 'TEXT',
  BUTTON = 'BUTTON'
}

/**
 * props for {@link WordDisplay} component
 */
export interface WordDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  variant?: WordDisplayVariant;
  suppressAfter?: boolean;
  parts?: Word[];
  corpus?: Corpus;
  allowGloss?: boolean;
  links?: Map<string, Link[]>;
}

/**
 * Display a word made up of one or more parts with spacing after it
 * @param readonly whether the word should be displayed in read-only mode
 * @param variant variant to use for word display
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 * @param allowGloss boolean denoting whether to display gloss information if available.
 */
export const WordDisplay = ({
                              readonly,
                              variant,
                              suppressAfter,
                              onlyLinkIds,
                              disableHighlighting,
                              parts,
                              corpus,
                              links,
                              allowGloss = false,
                            }: WordDisplayProps) => {
  const { language: languageInfo, hasGloss } = useMemo(() => corpus ?? { language: undefined, hasGloss: false }, [corpus]);
  const { preferences } = React.useContext(AppContext);
  const ref = parts?.find((part) => part.id)?.id;
  const computedVariant = useMemo(() => {
    if (!!variant) return variant;
    return WordDisplayVariant.TEXT;
  }, [variant]);

  return (
    <>
      <Typography
        component={'span'}
        key={`${
          ref
            ? BCVWP.parseFromString(ref).toTruncatedReferenceString(
              BCVWPField.Word
            )
            : uuid()
        }-${languageInfo?.code}`}
        style={{
          padding: '1px'
        }}
      >
        {
          (computedVariant === WordDisplayVariant.BUTTON ?
            (
              <>
                <ButtonWord
                  disableHighlighting={disableHighlighting}
                  disabled={readonly}
                  suppressAfter={suppressAfter}
                  onlyLinkIds={onlyLinkIds}
                  links={links}
                  tokens={parts}
                  corpus={corpus}
                  enableGlossDisplay={preferences?.showGloss && hasGloss}
                />
              </>
            ) : (
              <>
                {parts?.map((part) => (
                  <React.Fragment key={part?.id}>
                    <TextSegment
                      key={part.id}
                      readonly={readonly}
                      disableHighlighting={disableHighlighting}
                      onlyLinkIds={onlyLinkIds}
                      word={part}
                      links={links}
                      languageInfo={languageInfo}
                      showAfter={!suppressAfter}
                    />
                  </React.Fragment>
                ))}
                <span> </span>
              </>
            )
          )
        }
      </Typography>
    </>
  );
};
