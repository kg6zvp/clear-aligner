import { LanguageInfo } from '../../structs';
import { Typography } from '@mui/material';
import { PropsWithChildren } from 'react';
import * as React from 'react';

export interface LocalizedTextDisplayProps
  extends React.ComponentProps<typeof Typography> {
  languageInfo?: LanguageInfo;
}

export const LocalizedTextDisplay = ({
  children,
  languageInfo,
  ...typographyProps
}: PropsWithChildren<LocalizedTextDisplayProps>) => {
  return (
    <Typography
      component={'span'}
      sx={{
        ...(languageInfo?.fontFamily
          ? { fontFamily: languageInfo?.fontFamily }
          : {}),
      }}
      {...typographyProps}
    >
      {children}
    </Typography>
  );
};
