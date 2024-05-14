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
}

/**
 * Display a group of buttons, each with its own corresponding value
 * @param value currently chosen value, highlights the button with this value to indicate it is selected
 * @param items list of buttons and their corresponding values (string or ReactElement)
 * @param onSelect callback when a button is clicked by the user
 * @param sx style parameters
 */
export const SingleSelectButtonGroup = ({
  value,
  items,
  onSelect,
  sx,
}: SingleSelectButtonGroupProps) => {
  // console.log('inside SingleSelectButtonGroup')
  // console.log('value is: ', value)
  // console.log('items is: ', items)
  // console.log('onSelect is: ', onSelect)
  // console.log('sx is: ', sx)
  return (
    <ButtonGroup fullWidth={true} sx={sx}>
      {items.map((item) => {
        console.log('value === item.value: ', value === item.value)
        console.log('value is: ', value)
        console.log('item.value is: ', item.value)

        return <Button
          key={item.value}
          onClick={() => onSelect(item.value)}
          variant={value && value === item.value ? 'contained' : undefined}
        >
          {item.label}
        </Button>
      }

      )}
    </ButtonGroup>
  );
};
