/**
 * This file contains the GlossSegment Component which shows the Segment Gloss
 * in Alignment Mode
 */
import React from 'react';
import { ThemeMode } from '../themed';
import { Box, Divider, Grid, Menu, MenuItem, Paper, useTheme } from '@mui/material';
import { Corpus, LanguageInfo, Link, Word } from '../../structs';
import TextSegment from './index';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import ListItemIcon from '@mui/material/ListItemIcon';
import { Cancel, CheckCircle, Flag } from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import { useSaveLink } from '../../state/links/tableManager';

interface GlossSegmentProps extends LimitedToLinks {
  readonly?: boolean;
  suppressAfter?: boolean;
  parts?: Word[];
  links?: Map<string, Link>;
  corpus?: Corpus;
  allowGloss?: boolean;
  languageInfo?: LanguageInfo;
}

/**
 * Wrapper component for TextSegment that displays gloss information.
 * @param readonly whether the word should be displayed in read-only mode
 * @param suppressAfter suppress after string at the end of the word
 * @param parts parts to display as a single word
 * @param languageInfo language info for display
 * @param allowGloss boolean denoting whether to display gloss information if available.
 * @constructor Basic ctor.
 */
const GlossSegment: React.FC<GlossSegmentProps> = ({
                        readonly,
                        suppressAfter,
                        onlyLinkIds,
                        disableHighlighting,
                        links,
                        parts,
                        languageInfo
                      }: GlossSegmentProps) => {

  const [isLinkStateMenuOpen, setIsLinkStateMenuOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const {saveLink} = useSaveLink();

  const handleRightClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
    setIsLinkStateMenuOpen(true);
  }
  const handleClose = () => {
    setAnchorEl(null);
    setIsLinkStateMenuOpen(false);
  };
  const handleMenuClick = (event: any, wordPartID: string) => {
    const { linkState } = event.currentTarget.dataset;

    // prepare an updated link to save
    const thisLink = links?.get(wordPartID)
    const updatedLink = {
      ...thisLink,
      metadata: {
        ...thisLink?.metadata,
        status: linkState
      }
    }

    // save link
    saveLink(updatedLink as Link);

    setAnchorEl(null);
    setIsLinkStateMenuOpen(false);
  }

  const theme = useTheme();

  return (
    <>
      <Paper
        onContextMenu={event => handleRightClick(event)}
        variant="outlined"
        sx={theme => ({
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
              return (
                <React.Fragment key={wordPart.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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
                    <Grid container justifyContent={idx === 0 && (parts || []).length > 1 ? 'flex-end' : 'flex-start'} sx={{ height: '20px' }}>
                      <LocalizedTextDisplay
                        languageInfo={languageInfo}
                        variant="caption"
                        sx={theme => ({
                          color: theme.palette.tokenButtons.defaultTokenButtons.text
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
                        borderWidth: '1px',
                        mx: .5,
                        borderColor:  theme.palette.tokenButtons.defaultTokenButtons.outline,
                      })} />
                    )
                  }
                  <Menu
                    id="link-state-menu"
                    anchorEl={anchorEl}
                    open={isLinkStateMenuOpen}
                    onClose={handleClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem>
                      wordPart.id is: {wordPart.id}
                    </MenuItem>
                    <MenuItem
                      data-link-state={'created'}
                      onClick={(e) => handleMenuClick( e, wordPart.id)}
                    >
                      <ListItemIcon >
                        <LinkIcon sx={{
                          color : theme.palette.primary.main
                        }} />
                      </ListItemIcon>
                      Aligned
                    </MenuItem>
                    <MenuItem
                      data-link-state={'rejected'}
                      onClick={(e) => handleMenuClick( e, wordPart.id)}
                    >
                      <ListItemIcon >
                        <Cancel sx={{
                          color : theme.palette.error.main
                        }} />
                      </ListItemIcon>
                      Rejected
                    </MenuItem>
                    <MenuItem
                      data-link-state={'approved'}
                      onClick={(e) => handleMenuClick( e, wordPart.id)}
                    >
                      <ListItemIcon>
                        <CheckCircle sx={{
                          color : theme.palette.success.main
                        }}/>
                      </ListItemIcon>
                      Approved
                    </MenuItem>
                    <MenuItem
                      data-link-state={'needsReview'}
                      onClick={(e) => handleMenuClick( e, wordPart.id)}
                    >
                      <ListItemIcon>
                        <Flag sx={{
                          color : theme.palette.warning.main
                        }} />
                      </ListItemIcon>
                      Flagged
                    </MenuItem>
                  </Menu>
                </React.Fragment>
              )
            })
          }
        </Grid>
      </Paper>
    </>
  );
}
export default GlossSegment;
