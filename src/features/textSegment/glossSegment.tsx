/**
 * This file contains the GlossSegment Component which shows the Segment Gloss
 * in Alignment Mode
 */
import React from 'react';
import { ThemeMode } from '../themed';
import { Box, Divider, Grid, Menu, MenuItem, Paper, Typography, useTheme } from '@mui/material';
import { Corpus, LanguageInfo, Link, Word } from '../../structs';
import TextSegment from './index';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LimitedToLinks } from '../corpus/verseDisplay';
import ListItemIcon from '@mui/material/ListItemIcon';
import { Cancel, CheckCircle, Flag } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
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
  const [linkState ,setLinkState ] = React.useState("")
  const [wordPartID, setWordPartID] = React.useState("");

  const handleRightClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, wordPartID: string) => {
    setWordPartID(wordPartID);
    // grab the link if it exists
    const thisLink = links?.get(wordPartID)

    // if this is a valid link, open the menu
    if(thisLink){
      setLinkState(thisLink?.metadata.status);
      setAnchorEl(event.currentTarget);
      setIsLinkStateMenuOpen(true);
    }
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
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                  }}
                  >
                    <Box
                      onContextMenu={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleRightClick(event, wordPart.id)}
                    >
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
                        <MenuItem
                          data-link-state={'created'}
                          onClick={(e) => handleMenuClick( e, wordPartID)}
                        >
                          <ListItemIcon >
                            <LinkIcon sx={{
                              color : theme.palette.primary.main
                            }} />
                          </ListItemIcon>
                          <Box
                            sx={{width: '87px', display: 'flex', justifyContent: 'space-between'}}
                          >
                            <Typography
                              sx={{fontSize: '13px'}}
                            >
                              Aligned
                            </Typography>
                            {linkState === 'created' && <CheckIcon sx={{width: '18px', height: '20px'}}/>
                            }
                          </Box>
                        </MenuItem>
                        <MenuItem
                          data-link-state={'rejected'}
                          onClick={(e) => handleMenuClick( e, wordPartID)}
                        >
                          <ListItemIcon >
                            <Cancel sx={{
                              color : theme.palette.error.main
                            }} />
                          </ListItemIcon>
                          <Box
                            sx={{width: '87px', display: 'flex', justifyContent: 'space-between', gap: '12px'}}
                          >
                            <Typography
                              sx={{fontSize: '13px'}}
                            >
                              Rejected
                            </Typography>
                            {linkState === 'rejected' && <CheckIcon sx={{width: '18px', height: '20px'}}/>
                            }
                          </Box>
                        </MenuItem>
                        <MenuItem
                          data-link-state={'approved'}
                          onClick={(e) => handleMenuClick( e, wordPartID)}
                        >
                          <ListItemIcon>
                            <CheckCircle sx={{
                              color : theme.palette.success.main
                            }}/>
                          </ListItemIcon>
                          <Box
                            sx={{width: '87px', display: 'flex', justifyContent: 'space-between', gap: '12px'}}
                          >
                            <Typography
                              sx={{fontSize: '13px'}}
                            >
                              Approved
                            </Typography>
                            {linkState === 'approved' && <CheckIcon sx={{width: '18px', height: '20px'}}/>
                            }
                          </Box>
                        </MenuItem>
                        <MenuItem
                          data-link-state={'needsReview'}
                          onClick={(e) => handleMenuClick( e, wordPartID)}
                        >
                          <ListItemIcon>
                            <Flag sx={{
                              color : theme.palette.warning.main
                            }} />
                          </ListItemIcon>
                          <Box
                            sx={{width: '87px', display: 'flex', justifyContent: 'space-between'}}
                          >
                            <Typography
                              sx={{fontSize: '13px'}}
                            >
                              Flagged
                            </Typography>
                            {linkState === 'needsReview' && <CheckIcon sx={{width: '18px', height: '20px'}}/>
                            }
                          </Box>
                        </MenuItem>
                      </Menu>
                    </Box>
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
