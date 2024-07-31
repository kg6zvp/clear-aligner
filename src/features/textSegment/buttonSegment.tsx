/**
 * This file contains the GlossSegment Component which shows the Segment Gloss
 * in Alignment Mode
 */
import React, { useMemo } from 'react';
import { ThemeMode } from '../themed';
import { Box, Divider, Grid, Paper } from '@mui/material';
import { Corpus, LanguageInfo, Link, Word } from '../../structs';
import TextSegment from './index';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import { toggleTextSegment } from '../../state/alignment.slice';
import { hover } from 'state/textSegmentHover.slice';
import { useAppDispatch, useAppSelector } from '../../app';
import BCVWP from '../bcvwp/BCVWPSupport';

interface ButtonSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  links?: Map<string, Link>;
  corpus?: Corpus;
  languageInfo?: LanguageInfo;
}

/**
 * Wrapper component for TextSegment that displays text segments as buttons.
 * @param readonly whether the word should be displayed in read-only mode
 * @param onlyLinkIds only display highlighting if it's a member of one of the given links
 * @param disableHighlighting whether highlighting on hover should be disabled
 * @param links link data indexed by word
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 */
const ButtonSegment: React.FC<ButtonSegmentProps> = ({
                        readonly,
                        suppressAfter,
                        onlyLinkIds,
                        disableHighlighting,
                        links,
                        parts,
                        languageInfo
                      }: ButtonSegmentProps) => {
  const dispatch = useAppDispatch();

  const hasInProgressLink = useAppSelector(
    (state) => !!state.alignment.present.inProgressLink
  );

  return (
    <Paper variant="outlined" sx={theme => ({
      display: 'inline-block',
      p: 1,
      m: .25,
      borderColor:  theme.palette.tokenButtons.defaultTokenButtons.outline,
      ...(theme.palette.mode === ThemeMode.DARK ? {
        background: 'transparent'
      } : {})
    })}>
      <Grid container>
        {
          (parts || []).map((wordPart: Word, idx: number) => {
            const wordLinks = useMemo<Link[]>(() => {
              if (!links
                || !wordPart?.id) {
                return [];
              }
              const result = links.get(BCVWP.sanitize(wordPart.id));
              return (result ? [result] : []);
            }, [links, wordPart?.id]);
            const isLinked = useMemo(
              () => (wordLinks ?? []).length > 0,
              [links]
            );
            const wasMemberOfCurrentlyEditedLink = useAppSelector((state) =>
              state.alignment.present.inProgressLink?.id && wordLinks.map((link) => link.id).includes(state.alignment.present.inProgressLink?.id)
            );
            return (
              <React.Fragment key={wordPart.id}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                  }}
                  onMouseEnter={readonly ? undefined : () => {
                    dispatch(hover(wordPart));
                  }}
                  onMouseLeave={readonly ? undefined : () => {
                    dispatch(hover(null));
                  }}
                  onClick={readonly || (isLinked && hasInProgressLink && !wasMemberOfCurrentlyEditedLink)
                            ? undefined
                            : () => dispatch(toggleTextSegment({
                      foundRelatedLinks: (wordLinks ?? []),
                      word: wordPart
                    }))
                  } >
                  <LocalizedTextDisplay languageInfo={languageInfo}>
                  </LocalizedTextDisplay>
                  <TextSegment
                    key={wordPart.id}
                    readonly={readonly}
                    onlyLinkIds={onlyLinkIds}
                    word={wordPart}
                    links={links}
                    languageInfo={languageInfo}
                    disableHighlighting={disableHighlighting}
                    showAfter={!suppressAfter}
                    alignment={idx === 0 && (parts || []).length > 1 ? 'flex-end' : 'flex-start'}
                  />
                </Box>
                {
                  idx !== ((parts || []).length - 1) && (
                    <Divider flexItem orientation="vertical" sx={theme => ({
                      borderStyle: 'dashed',
                      borderWidth: '1px',
                      mx: .5,
                      borderColor:  theme.palette.tokenButtons.defaultTokenButtons.outline,
                    })} />
                  )
                }
              </React.Fragment>
            )
          })
        }
      </Grid>
    </Paper>
  );
}
export default ButtonSegment;
