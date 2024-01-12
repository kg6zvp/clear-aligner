import {Meta} from "@storybook/react";
import {LocalizedTextDisplay, LocalizedTextDisplayProps} from "./index";

const meta: Meta<typeof LocalizedTextDisplay> = {
  title: 'LocalizedTextDisplay',
  component: LocalizedTextDisplay
};

export default meta;

export const Default = (props: LocalizedTextDisplayProps) => <LocalizedTextDisplay {...props}/>;
Default.args = {
  children: 'no special handling'
} as LocalizedTextDisplayProps;

export const Hebrew = (props: LocalizedTextDisplayProps) =>  <LocalizedTextDisplay {...props}/>;
Hebrew.args = {
  children: 'בְּ',
  languageInfo: {
    code: 'heb',
    textDirection: 'rtl',
    fontFamily: 'sbl-hebrew'
  }
} as LocalizedTextDisplayProps;
