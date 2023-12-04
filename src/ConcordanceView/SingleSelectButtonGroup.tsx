import {Button, ButtonGroup} from "@mui/material";

export interface SingleSelectButtonGroupProps {
  value?: string;
  items: {
    value: string;
    label: string;
  }[];
  onSelect: (value: string) => void;
}

export const SingleSelectButtonGroup = ({value, items, onSelect}: SingleSelectButtonGroupProps) => {
  return <ButtonGroup fullWidth={true}>
    {items.map(item =>
      <Button
        key={item.value}
        onClick={() => onSelect(item.value)}
        variant={value && value === item.value ? 'contained' : undefined}>{item.label}</Button>)}
  </ButtonGroup>
}
