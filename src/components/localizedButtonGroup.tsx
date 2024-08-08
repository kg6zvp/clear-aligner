import { ButtonGroup, ButtonGroupProps, Theme } from '@mui/material';
import { LanguageInfo, TextDirection } from '../structs';
import { useMemo } from 'react';
import { SxProps } from '@mui/system';

/**
 * props for {@link LocalizedButtonGroup}
 */
export interface LocalizedButtonGroupProps extends ButtonGroupProps {
  languageInfo?: LanguageInfo;
}

const normalRoundedRadius = '4px';
const borderRadius = 0;

/**
 * component to display buttons with localization awareness (things like LTR, RTL display, font choices, etc.)
 * @param languageInfo language information used for the button group
 * @param sx style information
 * @param children buttons in the button group
 * @param others any other parameters normally applied to a material UI {@link ButtonGroup}
 */
export const LocalizedButtonGroup = ({
                                      languageInfo,
                                      sx,
                                      children,
                                      ...others
                                     }: LocalizedButtonGroupProps) => {

  const firstButtonSx = useMemo<SxProps<Theme>>(() => languageInfo?.textDirection === TextDirection.LTR
    ? ({ })
    : ({
        borderTopRightRadius: normalRoundedRadius,
        borderBottomRightRadius: normalRoundedRadius,
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
        borderLeftStyle: 'dashed !important',
      }), [languageInfo?.textDirection]);

  const middleButtonSx = useMemo<SxProps<Theme>>(() => ({
    borderLeftStyle: 'dashed !important',
    borderRightStyle: 'dashed !important'
  }), []);

  const lastButtonSx = useMemo<SxProps<Theme>>(() => languageInfo?.textDirection === TextDirection.LTR
    ? ({ })
    : ({
      borderRightStyle: 'dashed !important',
      borderTopRightRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
      borderTopLeftRadius: normalRoundedRadius,
      borderBottomLeftRadius: normalRoundedRadius
    }), [languageInfo?.textDirection]);

  const sxProp = useMemo<SxProps<Theme>>(() => {
    return {
      ...(sx ?? {}),
      direction: languageInfo?.textDirection ?? TextDirection.LTR,
      ...(!!languageInfo?.fontFamily ? {
        fontFamily: languageInfo?.fontFamily
      } : {}),
      margin: '1px',
      '.MuiButtonGroup-grouped': {
        paddingX: '4px !important',
        minWidth: '12px !important',
        ...((sx as any|undefined)?.['.MuiButtonGroup-grouped'] ?? {}),
      },
      '.MuiButtonGroup-firstButton': firstButtonSx,
      '.MuiButtonGroup-middleButton': middleButtonSx,
      '.MuiButtonGroup-lastButton': lastButtonSx
    };
  }, [sx, languageInfo?.textDirection, languageInfo?.fontFamily, languageInfo?.code]);

  return (
    <ButtonGroup
      sx={sxProp}
      dir={languageInfo?.textDirection ?? TextDirection.LTR}
      {...others}>
      {children}
    </ButtonGroup>
  );
}
