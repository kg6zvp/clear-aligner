import { Corpus, TextDirection, Word } from '../../structs';
import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import TextSegment from '../textSegment';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import React from 'react';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { AppContext } from '../../App';
import { ThemeMode } from '../themed';

export interface WordDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  corpus?: Corpus;
  allowGloss?: boolean;
}

/**
 * Display a word made up of one or more parts with spacing after it
 * @param readonly whether the word should be displayed in read-only mode
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 * @param allowGloss boolean denoting whether to display gloss information if available.
 */
export const WordDisplay = ({
                              readonly,
                              suppressAfter,
                              onlyLinkIds,
                              parts,
                              corpus,
                              allowGloss = true
                            }: WordDisplayProps) => {
  const { language: languageInfo, hasGloss } = corpus ?? { languageInfo: null, hasGloss: false };
  const { preferences } = React.useContext(AppContext);
  const ref = parts?.find((part) => part.id)?.id;

  return (
    <>
      <Typography
        component={'span'}
        key={`${
          ref
            ? BCVWP.parseFromString(ref).toTruncatedReferenceString(
              BCVWPField.Word
            )
            : ''
        }-${languageInfo?.code}`}
        style={{
          padding: '1px'
        }}
      >
        {
          (hasGloss && preferences.showGloss && allowGloss) ? (
            <Paper variant="outlined" sx={theme => ({
              display: 'inline-block',
              p: 1,
              m: .25,
              borderColor: theme.palette.mode === ThemeMode.LIGHT ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              ...(theme.palette.mode === ThemeMode.DARK ? {
                background: 'transparent'
              } : {})
            })}>
              <Grid container>
                {
                  (parts || []).map((wordPart: Word, idx: number) => {
                    return (
                      <React.Fragment key={wordPart.id}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <TextSegment
                            key={wordPart.id}
                            readonly={readonly}
                            onlyLinkIds={onlyLinkIds}
                            word={wordPart}
                            languageInfo={languageInfo}
                            showAfter={!suppressAfter}
                            alignment={idx === 0 && (parts || []).length > 1 ? 'flex-end' : 'flex-start'}
                          />
                          <Grid container justifyContent={idx === 0 && (parts || []).length > 1 ? 'flex-end' : 'flex-start'} sx={{ height: '20px' }}>
                            <LocalizedTextDisplay
                              languageInfo={languageInfo}
                              variant="caption"
                              sx={theme => ({
                                color: theme.palette.mode === ThemeMode.LIGHT ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)',
                              })}
                            >
                              {wordPart.gloss || "-"}
                            </LocalizedTextDisplay>
                          </Grid>
                        </Box>
                        {
                          idx !== ((parts || []).length - 1) && (
                            <Divider flexItem orientation="vertical" sx={theme => ({
                              borderStyle: 'dashed',
                              borderWidth: '2px',
                              width: '2px',
                              mx: .5,
                              borderColor: theme.palette.mode === ThemeMode.LIGHT ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)'
                            })} />
                          )
                        }
                      </React.Fragment>
                    )
                  })
                }
              </Grid>
            </Paper>
          ) : (
            <>
              {parts?.map((part) => (
                <React.Fragment key={part?.id}>
                  <TextSegment
                    key={part.id}
                    readonly={readonly}
                    onlyLinkIds={onlyLinkIds}
                    word={part}
                    languageInfo={languageInfo}
                  />
                  {!suppressAfter && (
                    <>
                      {part.after && (
                        <LocalizedTextDisplay
                          key={`${part.id}-after`}
                          languageInfo={languageInfo}
                        >
                          {part.after}
                        </LocalizedTextDisplay>
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
              <span> </span>
            </>
          )
        }
      </Typography>
    </>
  );
};
