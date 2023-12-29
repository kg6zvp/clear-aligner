import { Meta } from '@storybook/react';
import { VerseDisplay, VerseDisplayProps } from './verseDisplay';
import { Verse } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';

const meta: Meta<typeof VerseDisplay> = {
  title: 'VerseDisplay',
  component: VerseDisplay,
};

export default meta;

const mockVerse: Verse = {
  bcvId: BCVWP.parseFromString('45005003'),
  citation: '5:3',
  words: [
    {
      id: '45005003001',
      corpusId: 'na27-YLT',
      text: 'And',
      position: 1,
    },
    {
      id: '45005003002',
      corpusId: 'na27-YLT',
      text: 'not',
      position: 2,
    },
    {
      id: '45005003003',
      corpusId: 'na27-YLT',
      text: 'only',
      position: 3,
    },
    {
      id: '45005003004',
      corpusId: 'na27-YLT',
      text: 'so',
      position: 4,
    },
  ],
};

export const Default = (props: VerseDisplayProps) => (
  <VerseDisplay {...props} />
);

Default.args = {
  verse: mockVerse,
} as VerseDisplayProps;

export const Disabled = (props: VerseDisplayProps) => (
  <VerseDisplay {...props} />
);
Disabled.args = {
  readonly: true,
  verse: mockVerse,
} as VerseDisplayProps;
