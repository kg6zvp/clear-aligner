import { Corpus, LanguageInfo, Link, LinkStatus, Word } from '../../structs';
import React, { useMemo } from 'react';
import { Button, SvgIconOwnProps, SxProps, Theme } from '@mui/material';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LocalizedButtonGroup } from '../../components/localizedButtonGroup';
import { useAppDispatch } from '../../app';
import { hover } from '../../state/textSegmentHover.slice';
import { Box } from '@mui/system';
import { toggleTextSegment } from '../../state/alignment.slice';
import { Cancel, CheckCircle, Flag, InsertLink, Person } from '@mui/icons-material';
import useAlignmentStateContextMenu from '../../hooks/useAlignmentStateContextMenu';

export interface ButtonWordProps {
  tokens?: Word[];
  /**
   * whether gloss should be displayed
   */
  enableGlossDisplay?: boolean;
  /**
   * link data
   */
  links?: Map<string, Link>;
  corpus?: Corpus;
  suppressAfter?: boolean;
  disabled?: boolean;
  hoverHighlightingDisabled?: boolean;
}

export const ButtonWord = ({
                            disabled,
                            links,
                            tokens,
                            corpus,
                            enableGlossDisplay,
                            suppressAfter,
                            hoverHighlightingDisabled
                           }: ButtonWordProps) => {
  const { language: languageInfo, hasGloss } = useMemo(() => corpus ?? { language: undefined, hasGloss: false }, [corpus]);
  return (
    <LocalizedButtonGroup id={tokens?.[0]?.id}
                          disabled={disabled}
                          languageInfo={languageInfo}
                          sx={{
                            '.MuiButtonGroup-grouped': {
                              padding: '0px !important',
                              minWidth: '12px !important',
                              height: '62px !important'
                            },
                          }} >
      {tokens?.map((token) => <ButtonToken key={token.id} token={token} enableGlossDisplay={enableGlossDisplay} links={links} languageInfo={languageInfo} suppressAfter={suppressAfter} disabled={disabled} hoverHighlightingDisabled={hoverHighlightingDisabled} />)}
    </LocalizedButtonGroup>
  );
}

export interface ButtonTokenProps {
  token: Word;
  /**
   * whether gloss should be displayed
   */
  enableGlossDisplay?: boolean;
  /**
   * link data
   */
  links?: Map<string, Link>;
  languageInfo?: LanguageInfo;
  suppressAfter?: boolean;
  disabled?: boolean;
  /**
   * whether hover highlighting behavior is enabled
   */
  hoverHighlightingDisabled?: boolean;
}

export const ButtonToken = ({
                              disabled,
                              links,
                              token,
                              languageInfo,
                              enableGlossDisplay,
                              suppressAfter,
                              hoverHighlightingDisabled
                            }: ButtonTokenProps) => {
  const dispatch = useAppDispatch();

  // Allow the user to right-click on an alignment and change it's state
  const [ContextMenuAlignmentState, handleRightClick] = useAlignmentStateContextMenu(links);

  const memberOfLink = useMemo(() => links?.get(token.id), [links, token.id]);

  const sourceIndicator = useMemo<JSX.Element>(() => {
    const iconProps: SvgIconOwnProps = {
      sx: {
        fontSize: '16px',
        transform: 'translate(0, -4px)',
      }
    };
    /* eslint-disable no-fallthrough */
    switch (memberOfLink?.metadata.origin) {
      case 'manual':
        return (<Person {...iconProps} />)
      default:
        return (<>
        </>);
    }
  }, [memberOfLink?.metadata.origin]);

  const statusIndicator = useMemo<JSX.Element>(() => {
    const baseSx: SxProps<Theme> = {
      fontSize: '16px',
      transform: 'translate(0, 3px)',
    };
    switch (memberOfLink?.metadata.status) {
      case LinkStatus.APPROVED:
        return (<CheckCircle sx={{
          ...baseSx,
          color: 'success.main'
        }} />);
      case LinkStatus.CREATED:
        return (<InsertLink sx={{
          ...baseSx,
          color: 'primary.main'
        }} />);
      case LinkStatus.NEEDS_REVIEW:
        return (<Flag sx={(theme) => ({
          ...baseSx,
          color: theme.palette.warning.main
        })} />);
      case LinkStatus.REJECTED:
        return (<Cancel sx={{
          ...baseSx,
          color: 'error.main'
        }} />);
    }
    if (memberOfLink) {
      return (<InsertLink sx={{
          ...baseSx,
          color: 'primary.main'
        }} />);
    }
    return (<>
    </>);
  }, [memberOfLink]);

  const hoverColors = useMemo(() => {
    return {
    };
  }, [memberOfLink]);

  return (<>
    <Box
      onContextMenu={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleRightClick(event, token.id, links)}
    >
      <Button
        disabled={disabled}
        component={'button'}
        sx={(theme) => ({
          textTransform: 'none',
          color: theme.palette.text.primary,
          borderColor: `${theme.palette.text.disabled} !important`,
          '&:hover': hoverColors,
          padding: '0 !important',
        })}
        onMouseEnter={!!hoverHighlightingDisabled ? () => {} : () => dispatch(hover(token))}
        onMouseLeave={!!hoverHighlightingDisabled ? () => {} : () => dispatch(hover(null))}
        onClick={() => dispatch(toggleTextSegment({ foundRelatedLinks: [memberOfLink].filter((v) => !!v), word: token }))}>
        <LocalizedTextDisplay languageInfo={languageInfo}>
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              flexDirection: 'column'
            }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'left',
                m: 0
              }}>
              {sourceIndicator}
            </Box>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                marginLeft: '12px',
                marginRight: '12px',
                flexGrow: 1
                //m: '12px'
              }}>
              {token.text}
            </Box>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'right',
                m: 0
              }}>
              {statusIndicator}
            </Box>
          </Box>
        </LocalizedTextDisplay>
      </Button>
      <ContextMenuAlignmentState />
    </Box>
      {!!token.after && !suppressAfter
        ? <Button key={`${token.id}-after`} disabled={true}>
            <LocalizedTextDisplay languageInfo={languageInfo}>
              {token.after}
            </LocalizedTextDisplay>
          </Button> : ''}
  </>);
}
