/**
 * This file contains the SingleSelectButtonGroup component used in
 * ConcordanceView
 */
import { Button, ButtonGroup, SxProps, Theme } from '@mui/material';
import { ReactElement } from 'react';

export interface SingleSelectButtonGroupProps {
  sx?: SxProps<Theme>;
  value?: string;
  items: {
    value: string;
    label: string | ReactElement;
  }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  customDisabled?: boolean;
}

/**
 * Display a group of buttons, each with its own corresponding value
 * @param value currently chosen value, highlights the button with this value to indicate it is selected
 * @param items list of buttons and their corresponding values (string or ReactElement)
 * @param onSelect callback when a button is clicked by the user
 * @param sx style parameters
 * @param disabled (optional) flag to disable the buttons
 * @param customDisabled (option) boolean flag to disable the non-selected buttons
 */
export const SingleSelectButtonGroup = ({
  value,
  items,
  onSelect,
  sx,
  disabled = false,
  customDisabled = false,
}: SingleSelectButtonGroupProps) => {
  return (
    <ButtonGroup fullWidth={true} sx={sx} disabled={disabled}>
      {items.map((item) =>
        <Button
          key={item.value}
          onClick={() => onSelect(item.value)}
          variant={value && value === item.value ? 'contained' : undefined}
          disabled={value && value === item.value ? false : customDisabled}
        >
          {item.label}
        </Button>
      )}
    </ButtonGroup>
  );
};
