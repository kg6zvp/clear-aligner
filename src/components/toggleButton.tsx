/**
 * This file contains ToggleButton component used in the Concordance View
 */
import { Button, useTheme } from '@mui/material';
import React from 'react';

/**
 * Props for the ToggleButton Component
 */
export interface ToggleButtonProps {
  onSelect: Function,
  variant: "text" | "contained" | "outlined" | undefined
  children: React.ReactNode,
  backgroundColor: string,
  buttonAction: string,
}

/**
 * ToggleButton Component combines a color from the parent component with
 * colors from the custom MUI color palette.
 */
export const ToggleButton = ({onSelect, variant, children, backgroundColor, buttonAction} : ToggleButtonProps) => {
  const theme = useTheme();

  const handleSelect = () => {
    onSelect(buttonAction)
  }

  return (
    <Button
      variant={variant}
      onClick={handleSelect}
      sx={{
        width: '40px',
      '&:disabled' : theme.palette.toggleButtons.disabled,
      '&:enabled' : theme.palette.toggleButtons.enabled,
      '&:hover' : theme.palette.toggleButtons.hover,
      '&.MuiButton-contained' : {
          ...theme.palette.toggleButtons.selected,
          backgroundColor: backgroundColor,
      }
    }}>
      {children}
    </Button>
  )
}

