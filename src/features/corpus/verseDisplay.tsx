import { Grid, Typography } from '@mui/material';
import {LanguageInfo, Verse, Word} from '../../structs';
import { ReactElement } from 'react';
import TextSegment from '../textSegment';

export interface VerseDisplayProps {
  readonly?: boolean;
  languageInfo?: LanguageInfo;
  verse: Verse;
}

export const VerseDisplay = ({ readonly, languageInfo, verse }: VerseDisplayProps) => {
  const textDirection = languageInfo?.textDirection;
  return (
    <Grid
      container
      lang={languageInfo?.code}
      sx={{
        p: '1px',
        pl: 4,
        //flex: 8,
        flexGrow: 1,
        overflow: 'auto',
        ...(textDirection && textDirection === 'rtl' ? { direction: textDirection } : {})
      }}
    >
      <Typography
        style={{
          paddingBottom: '0.5rem',
          paddingLeft: '0.7rem',
          paddingRight: '0.7rem',
        }}
      >
        {(verse?.words || []).map((word: Word): ReactElement => {
          return <TextSegment readonly={readonly} key={word.id} word={word} />;
        })}
      </Typography>
    </Grid>
  );
};
