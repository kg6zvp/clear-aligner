/**
 * This file contains the PerRowLinkStateSelector component used in
 * ConcordanceView
 */
import { IconButton, Stack, SxProps, Theme, useTheme } from '@mui/material';
import { ReactElement } from 'react';

/**
 * props for the PerRowLinkStateSelector
 */
export interface PerRowLinkStateSelectorProps {
  sx?: SxProps<Theme>;
  value?: string;
  items: {
    value: string;
    label: string | ReactElement;
    tooltip?: string;
  }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  customDisabled?: boolean;
  currentState: string;
}

/**
 * Display a group of buttons, each with its own corresponding value
 * @param value currently chosen value, highlights the button with this value to indicate it is selected
 * @param items list of buttons and their corresponding values (string or ReactElement)
 * @param onSelect callback when a button is clicked by the user
 * @param sx style parameters
 * @param disabled (optional) flag to disable the buttons
 * @param customDisabled (optional) boolean flag to disable the non-selected buttons
 */
export const PerRowLinkStateSelector = ({
  value,
  items,
  onSelect,
  disabled = false,
  customDisabled = false,
  currentState
}: PerRowLinkStateSelectorProps) => {

  const theme = useTheme();

  // remove the current state rom the list of state icons to display
  const filteredItems = items.filter((item) => item.value !== currentState)

  return (

    <Stack
      sx={{
        border: `solid 1px ${theme.palette.linkStateSelector.border}`,
        borderRadius: '32px',
        paddingX: '4px',
        paddingY: '4px',
        gap: '12px',
        marginLeft: '-10px',
        backgroundColor: 'white'
      }}
      direction={'row'}
    >

      {filteredItems.map((item) =>
        <IconButton
          key={item.value}
          onClick={() => onSelect(item.value)}
          //variant={value && value === item.value ? 'contained' : undefined}
          disabled={value && value === item.value ? false : customDisabled}
          sx={{width: '16px'}}
        >
          {item.label}
        </IconButton>
      )}
    </Stack>
  );
};
