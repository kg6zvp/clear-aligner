import { Grid, Typography } from '@mui/material';
import { LanguageInfo, Verse, Word } from '../../structs';
import { ReactElement, useMemo } from 'react';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { WordDisplay } from '../wordDisplay';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';

export interface VerseDisplayProps {
  readonly?: boolean;
  languageInfo?: LanguageInfo;
  verse: Verse;
}

/**
 * Display the text of a verse and highlight the words included in alignments, includes a read-only mode for display
 * which doesn't edit alignments
 * @param readonly optional property to specify if the verse should be displayed in read-only mode
 * @param languageInfo language information to determine how the verse should be displayed
 * @param verse verse to be displayed
 * @constructor
 */
export const VerseDisplay = ({
  readonly,
  languageInfo,
  verse,
}: VerseDisplayProps) => {
  const textDirection = languageInfo?.textDirection;
  const verseTokens: (string | Word[])[] = useMemo(() => {
    const partsGroupedByWords = groupPartsIntoWords(verse.words);

    const finalTokens: (string | Word[])[] = [];

    partsGroupedByWords.forEach((word) => {
      finalTokens.push(word);
      if (word.at(-1)?.after) {
        finalTokens.push(word.at(-1)!.after!);
      }
    });

    return finalTokens;
  }, [verse?.words]);

  return (
    <Grid
      container
      lang={languageInfo?.code}
      sx={{
        p: '1px',
        pl: 4,
        flexGrow: 1,
        overflow: 'auto',
        ...(textDirection ? { direction: textDirection } : {}),
      }}
    >
      <Typography
        style={{
          paddingBottom: '0.5rem',
          paddingLeft: '0.7rem',
          paddingRight: '0.7rem',
        }}
      >
        {(verseTokens || []).map(
          (token: string | Word[], index): ReactElement => {
            if (typeof token === 'string') {
              return (
                <LocalizedTextDisplay key={index} languageInfo={languageInfo}>
                  {token}
                </LocalizedTextDisplay>
              );
            } else {
              return (
                <WordDisplay
                  readonly={readonly}
                  key={`${index}/${token.at(0)?.id}`}
                  languageInfo={languageInfo}
                  parts={token}
                />
              );
            }
          }
        )}
      </Typography>
    </Grid>
  );
};
