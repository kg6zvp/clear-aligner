import { Corpus, LanguageInfo, Link, LinkStatus, Word } from '../../structs';
import { useMemo } from 'react';
import { Button, decomposeColor, Stack, SvgIconOwnProps, SxProps, Theme, Typography, useTheme } from '@mui/material';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LocalizedButtonGroup } from '../../components/localizedButtonGroup';
import { useAppDispatch, useAppSelector } from '../../app';
import { hover } from '../../state/textSegmentHover.slice';
import { Box } from '@mui/system';
import { toggleTextSegment } from '../../state/alignment.slice';
import { AutoAwesome, Cancel, CheckCircle, Flag, InsertLink, Person } from '@mui/icons-material';
import { LimitedToLinks } from '../corpus/verseDisplay';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../common/data/project/corpus';
import _ from 'lodash';

/**
 * props for the {@link ButtonWord} component
 */
export interface ButtonWordProps extends LimitedToLinks {
  tokens?: Word[];
  /**
   * whether gloss should be displayed
   */
  enableGlossDisplay?: boolean;
  /**
   * link data
   */
  links?: Map<string, Link[]>;
  corpus?: Corpus;
  suppressAfter?: boolean;
  disabled?: boolean;
}

/**
 * Displays a word as a {@link LocalizedButtonGroup}
 * @param disabled if the word has input disabled
 * @param links links map to be displayed with this group of tokens
 * @param tokens tokens being displayed
 * @param corpus corpus for displayed tokens
 * @param enableGlossDisplay whether gloss display is toggled on
 * @param suppressAfter whether the after of tokens should be displayed or suppressed
 * @param disableHighlighting whether highlighting behavior is turned off, defaults to normal highlighting behavior
 */
export const ButtonWord = ({
                            disabled,
                            links,
                            tokens,
                            corpus,
                            enableGlossDisplay,
                            suppressAfter,
                            disableHighlighting
                           }: ButtonWordProps) => {
  const { language: languageInfo } = useMemo(() => corpus ?? { language: undefined }, [corpus]);

  return (
    <LocalizedButtonGroup id={tokens?.[0]?.id}
                          disabled={disabled}
                          languageInfo={languageInfo}
                          sx={{
                            borderStyle: 'none',
                            '.MuiButtonGroup-grouped': {
                              padding: '0px !important',
                              minWidth: '12px !important',
                              height: enableGlossDisplay ? '82px !important' : '62px !important'
                            },
                          }} >
      {tokens?.map((token) => <ButtonToken key={token.id} token={token} enableGlossDisplay={enableGlossDisplay} links={links} languageInfo={languageInfo} suppressAfter={suppressAfter} disabled={disabled} hoverHighlightingDisabled={disableHighlighting} />)}
    </LocalizedButtonGroup>
  );
}

/**
 * props used by {@link ButtonToken}
 */
export interface ButtonTokenProps {
  token: Word;
  /**
   * whether gloss should be displayed
   */
  enableGlossDisplay?: boolean;
  /**
   * whether rejected links should be shown. If this is false|undefined (default), it is as if the link does not exist
   */
  showRejected?: boolean;
  /**
   * link data
   */
  links?: Map<string, Link[]>;
  languageInfo?: LanguageInfo;
  suppressAfter?: boolean;
  disabled?: boolean;
  /**
   * whether hover highlighting behavior is enabled
   */
  hoverHighlightingDisabled?: boolean;
}

/**
 * component that displays an individual token as a button
 * @param disabled whether the button is disabled
 * @param links links possibly associated with the token
 * @param token token being displayed
 * @param languageInfo language information for the token
 * @param enableGlossDisplay whether gloss is toggled on
 * @param showRejected whether rejected links should be displayed
 * @param suppressAfter whether the after string should be displayed
 * @param hoverHighlightingDisabled whether normal hover behavior is suppressed
 */
export const ButtonToken = ({
                              disabled,
                              links,
                              token,
                              languageInfo,
                              enableGlossDisplay,
                              showRejected,
                              suppressAfter,
                              hoverHighlightingDisabled
                            }: ButtonTokenProps) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  /**
   * whether the current token is being hovered by the user
   */
  const isHoveredToken = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.side === token.side &&
      state.textSegmentHover.hovered?.id === token.id
  );

  /**
   * the token currently being hovered by the user
   */
  const currentlyHoveredToken = useAppSelector(
    (state) => state.textSegmentHover.hovered
  );

  /**
   * links currently being hovered over by the user, if any
   */
  const currentlyHoveredLinks = useMemo<Link[]>(() => {
    if (!links
      || !currentlyHoveredToken?.id) {
      return [];
    }
    const sanitized = BCVWP.sanitize(currentlyHoveredToken.id);
    const result = [...links.values()].flatMap((a) => a).find((link: Link) => link[currentlyHoveredToken.side].includes(sanitized));
    return result ? [result] : [];
  }, [links, currentlyHoveredToken?.id, currentlyHoveredToken?.side]);

  /**
   * link this token is a member of, undefined if not a member
   */
  const memberOfLinks = useMemo(() => {
    const foundLinks = links?.get(BCVWP.sanitize(token.id));
    if (showRejected) return foundLinks;
    return foundLinks?.filter((link) => link?.metadata.status !== LinkStatus.REJECTED);
  }, [links, showRejected, token.id]);

  /**
   * since rejected links no longer show up, we must filter the links and choose a primary link to use for display purposes that this token is a member of
   */
  const memberOfPrimaryLink = useMemo(() => memberOfLinks?.[0], [memberOfLinks]);

  const isSelectedInEditedLink = useAppSelector((state) => {
    switch (token.side) {
      case AlignmentSide.SOURCE:
        return !!state.alignment.present.inProgressLink?.sources.includes(
          BCVWP.sanitize(token.id)
        );
      case AlignmentSide.TARGET:
        return !!state.alignment.present.inProgressLink?.targets.includes(
          BCVWP.sanitize(token.id)
        );
    }
  });

  const isCurrentlyHoveredToken = useMemo<boolean>(() => token?.side === currentlyHoveredToken?.side && token?.id === currentlyHoveredToken?.id, [currentlyHoveredToken, token?.id, token?.side]);

  /**
   * whether this token is a member of an alignment that the currently hovered token is a member of
   */
  const isInLinkWithCurrentlyHoveredToken = useMemo(
    () => {
      return _.intersection(memberOfLinks, currentlyHoveredLinks).length > 0;
    },
    [memberOfLinks, currentlyHoveredLinks]
  );

  /**
   * this is the color used for the iconography and borders in an unselected state
   * when the token is selected, this is the background/fill color
   */
  const buttonPrimaryColor = useMemo(() => {
    if (!memberOfPrimaryLink?.metadata.status && isSelectedInEditedLink) return theme.palette.primary.main;
    if (!memberOfPrimaryLink?.metadata.status) return theme.palette.text.disabled;
    switch (memberOfPrimaryLink?.metadata.status) {
      case LinkStatus.APPROVED:
        return theme.palette.success.main;
      case LinkStatus.CREATED:
        return theme.palette.primary.main;
      case LinkStatus.NEEDS_REVIEW:
        return theme.palette.warning.main;
      case LinkStatus.REJECTED:
        return theme.palette.error.main;
      default:
        return theme.palette.text.disabled;
    }
  }, [memberOfPrimaryLink?.metadata.status, theme.palette.success.main, theme.palette.primary.main, theme.palette.warning.main, theme.palette.text.disabled, theme.palette.error.main, isSelectedInEditedLink]);

  const buttonNormalBackgroundColor = useMemo(() => theme.palette.background.default, [theme.palette.background.default]);

  const sourceIndicator = useMemo<JSX.Element>(() => {
    const color = (() => {
      if (isCurrentlyHoveredToken) return buttonPrimaryColor;
      if (isSelectedInEditedLink) {
        return buttonNormalBackgroundColor;
      }
      return buttonPrimaryColor;
    })();
    const iconProps: SvgIconOwnProps = {
      sx: {
        fontSize: '16px',
        transform: 'translate(0, -3px)',
        color,
      }
    };
    /* eslint-disable no-fallthrough */
    switch (memberOfPrimaryLink?.metadata.origin) {
      case 'machine':
        return (<AutoAwesome {...{
          ...iconProps,
          sx: {
            ...iconProps?.sx,
            color: undefined,
            fill: `url(#machine-color-gradient-${token.side}-${token.id}) !important`
          }
        }} />);
      case 'manual':
        return (<Person {...iconProps} />);
      default:
        return (<>
        </>);
    }
  }, [memberOfPrimaryLink?.metadata.origin, buttonPrimaryColor, isCurrentlyHoveredToken, isSelectedInEditedLink, buttonNormalBackgroundColor, token.side, token.id]);

  const statusIndicator = useMemo<JSX.Element>(() => {
    const color = (() => {
      if (isCurrentlyHoveredToken) return buttonPrimaryColor;
      if (isSelectedInEditedLink) {
        return buttonNormalBackgroundColor;
      }
      return buttonPrimaryColor;
    })();
    const baseSx: SxProps<Theme> = {
      fontSize: '16px',
      transform: 'translate(0, 2px)',
      color
    };
    switch (memberOfPrimaryLink?.metadata.status) {
      case LinkStatus.APPROVED:
        return (<CheckCircle sx={{
          ...baseSx,
        }} />);
      case LinkStatus.CREATED:
        /*if (memberOfPrimaryLink?.metadata.origin === 'machine') return (<InsertLink sx={{
          ...baseSx,
          color: color === buttonNormalBackgroundColor ? buttonNormalBackgroundColor : undefined,
          fill: color !== buttonNormalBackgroundColor ? `url(#machine-color-gradient-${token.side}-${token.id})` : undefined
        }} />); //*/
        return (<InsertLink sx={{
          ...baseSx
        }} />);
      case LinkStatus.NEEDS_REVIEW:
        return (<Flag sx={(theme) => ({
          ...baseSx,
        })} />);
      case LinkStatus.REJECTED:
        return (<Cancel sx={{
          ...baseSx,
        }} />);
    }
    if (memberOfPrimaryLink) {
      return (<InsertLink sx={{
          ...baseSx,
        }} />);
    }
    return (<>
    </>);
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberOfPrimaryLink, memberOfPrimaryLink?.metadata.status, memberOfPrimaryLink?.metadata.origin, isSelectedInEditedLink, buttonNormalBackgroundColor, isCurrentlyHoveredToken, buttonPrimaryColor, token.side, token.id]);

  const alpha = useMemo(() => '.12', []);
  const topColor = useMemo(() => decomposeColor('#33D6FF'), []);
  const bottomColor = useMemo(() => decomposeColor('#AD8CFF'), []);

  const backgroundImageGradientSolid = useMemo(() => `linear-gradient(rgba(${topColor.values[0]}, ${topColor.values[1]}, ${topColor.values[2]}), rgba(${bottomColor.values[0]}, ${bottomColor.values[1]}, ${bottomColor.values[2]}))`, [topColor.values, bottomColor.values]);

  const backgroundImageGradientTransparent = useMemo(() => `linear-gradient(rgba(${topColor.values[0]}, ${topColor.values[1]}, ${topColor.values[2]}, ${alpha}), rgba(${bottomColor.values[0]}, ${bottomColor.values[1]}, ${bottomColor.values[2]}, ${alpha}))`, [alpha, topColor.values, bottomColor.values]);

  const hoverSx: SxProps<Theme> = useMemo(() => {
    if (buttonPrimaryColor === theme.palette.text.disabled) {
      const decomposedColor = decomposeColor(theme.palette.primary.main)
      return ({
        backgroundColor: `rgba(${decomposedColor.values[0]}, ${decomposedColor.values[1]}, ${decomposedColor.values[2]}, ${alpha})`
      });
    }
    if (memberOfPrimaryLink?.metadata.origin === 'machine' && memberOfPrimaryLink?.metadata.status === LinkStatus.CREATED) {
      return ({
        backgroundColor: undefined,
        backgroundImage: backgroundImageGradientTransparent
      });
    } //*/
    const rgbColor = decomposeColor(buttonPrimaryColor);
    return ({
      backgroundColor: `rgba(${rgbColor.values[0]}, ${rgbColor.values[1]}, ${rgbColor.values[2]}, ${alpha})`
    });
  }, [buttonPrimaryColor, backgroundImageGradientTransparent, alpha, memberOfPrimaryLink?.metadata.origin, memberOfPrimaryLink?.metadata.status, theme.palette.text.disabled, theme.palette.primary.main]);

  return (<>
      <Button
        disabled={disabled}
        component={'button'}
        sx={(theme) => ({
          textTransform: 'none',
          color: isSelectedInEditedLink && !isHoveredToken ? buttonNormalBackgroundColor : theme.palette.text.primary,
          borderColor: `${buttonPrimaryColor} !important`,
          '&:hover': hoverSx,
          padding: '0 !important',
          ...(isSelectedInEditedLink ? {
            backgroundColor: memberOfPrimaryLink?.metadata.status === LinkStatus.CREATED && memberOfPrimaryLink?.metadata.origin === 'machine' ? undefined : buttonPrimaryColor,
            backgroundImage: memberOfPrimaryLink?.metadata.status === LinkStatus.CREATED && memberOfPrimaryLink?.metadata.origin === 'machine' ? backgroundImageGradientSolid : undefined
          } : {}),
          /**
           * override CSS with the hover CSS if this token is a member of a link with the currently hovered token
           */
          ...(isInLinkWithCurrentlyHoveredToken && !isSelectedInEditedLink ? hoverSx : {})
        })}
        onMouseEnter={!!hoverHighlightingDisabled ? () => {} : () => dispatch(hover(token))}
        onMouseLeave={!!hoverHighlightingDisabled ? () => {} : () => dispatch(hover(null))}
        onClick={() => dispatch(toggleTextSegment({ foundRelatedLinks: [memberOfPrimaryLink].filter((v) => !!v), word: token }))}>
        <svg width={0} height={0}>
          <linearGradient id={`machine-color-gradient-${token.side}-${token.id}`} x1={1} y1={0} x2={1} y2={1}>
            <stop offset={0} stopColor={'#33D6FF'} />
            <stop offset={1} stopColor={'#AD8CFF'} />
          </linearGradient>
        </svg>
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
                display: 'flex',
                marginLeft: '12px',
                marginRight: '12px',
                flexGrow: 1,
              }}>
              <Stack>
                {/*
                  * word text display
                  */}
                <LocalizedTextDisplay
                  languageInfo={languageInfo}
                  sx={{
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                  {token.text}
                </LocalizedTextDisplay>
                {/*
                  * gloss display
                  */}
                {enableGlossDisplay ?
                  <Typography
                    variant={'caption'}
                    sx={{
                      color: isSelectedInEditedLink && !isHoveredToken ? buttonNormalBackgroundColor : theme.palette.tokenButtons.defaultTokenButtons.text
                    }} >
                    {token.gloss ?? '-'}
                  </Typography> : <></>}
              </Stack>
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
      {!!token.after && !suppressAfter
        ? <Button disabled={true}>
            <LocalizedTextDisplay languageInfo={languageInfo}>
              {token.after}
            </LocalizedTextDisplay>
          </Button> : ''}
  </>);
}
