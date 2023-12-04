import {Meta} from "@storybook/react";
import {SingleSelectButtonGroup, SingleSelectButtonGroupProps} from "./SingleSelectButtonGroup";
import {useState} from "react";

const meta: Meta<typeof SingleSelectButtonGroup> = {
  title: "SingleSelectButtonGroup",
  component: SingleSelectButtonGroup
};

export default meta;

export const Default = (props: SingleSelectButtonGroupProps) => {
  const [ value, setValue ] = useState(props.value);
  return <SingleSelectButtonGroup value={value} items={props.items} onSelect={(value) => {
    setValue(value);
    props.onSelect && props.onSelect(value);
  }}/>;
}

Default.args = {
  items: [
    {
      value: 'first',
      label: 'First'
    },
    {
      value: 'second',
      label: 'Second'
    },
    {
      value: 'third',
      label: 'Third'
    },
    {
      value: 'fourth',
      label: 'Fourth'
    },
    {
      value: 'fifth',
      label: 'Fifth'
    }
  ]
} as SingleSelectButtonGroupProps;
