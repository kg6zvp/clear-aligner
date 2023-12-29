import { Grid, Typography } from '@mui/material';
import { Verse, Word } from '../../structs';
import { ReactElement } from 'react';
import TextSegment from '../textSegment';

export interface VerseDisplayProps {
  readonly?: boolean;
  verse: Verse;
}

export const VerseDisplay = ({ readonly, verse }: VerseDisplayProps) => {
  return (
    <Grid
      container
      sx={{
        p: '1px',
        pl: 4,
        //flex: 8,
        flexGrow: 1,
        overflow: 'auto',
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
