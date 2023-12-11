import {Button, ButtonGroup, SxProps, Theme} from "@mui/material";

export interface SingleSelectButtonGroupProps {
  sx?: SxProps<Theme>;
  value?: string;
  items: {
    value: string;
    label: string;
  }[];
  onSelect: (value: string) => void;
}

export const SingleSelectButtonGroup = ({value, items, onSelect, sx}: SingleSelectButtonGroupProps) => {
  return <ButtonGroup fullWidth={true} sx={sx}>
    {items.map(item =>
      <Button
        key={item.value}
        onClick={() => onSelect(item.value)}
        variant={value && value === item.value ? 'contained' : undefined}>{item.label}</Button>)}
  </ButtonGroup>
}
