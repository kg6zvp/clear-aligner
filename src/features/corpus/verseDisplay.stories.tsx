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

export const RTLVerse = (props: VerseDisplayProps) => {
  return (<VerseDisplay { ...props } />);
}
RTLVerse.args = {
  readonly: true,
  verse: {
    bcvId: BCVWP.parseFromString('45005003'),
    citation: '5:3',
    words: [
      {
        id: "450050030011",
        corpusId: "na27-YLT",
        text: "وَلَيْسَ",
        position: 1
      },
      {
        id: "450050030021",
        corpusId: "na27-YLT",
        text: "ذَلِكَ",
        position: 2
      },
      {
        id: "450050030031",
        corpusId: "na27-YLT",
        text: "فَقَطْ،",
        position: 3
      },
      {
        id: "450050030041",
        corpusId: "na27-YLT",
        text: "بَلْ",
        position: 4
      },
      {
        id: "450050030051",
        corpusId: "na27-YLT",
        text: "نَفْتَخِرُ",
        position: 5
      },
      {
        id: "450050030061",
        corpusId: "na27-YLT",
        text: "أَيْضًا",
        position: 6
      },
      {
        id: "450050030071",
        corpusId: "na27-YLT",
        text: "فِي",
        position: 7
      },
      {
        id: "450050030081",
        corpusId: "na27-YLT",
        text: "ٱلضِّيقَاتِ،",
        position: 8
      },
      {
        id: "450050030091",
        corpusId: "na27-YLT",
        text: "عَالِمِينَ",
        position: 9
      },
      {
        id: "450050030101",
        corpusId: "na27-YLT",
        text: "أَنَّ",
        position: 10
      },
      {
        id: "450050030111",
        corpusId: "na27-YLT",
        text: "ٱلضِّيقَ",
        position: 11
      },
      {
        id: "450050030121",
        corpusId: "na27-YLT",
        text: "يُنْشِئُ",
        position: 12
      },
      {
        id: "450050030131",
        corpusId: "na27-YLT",
        text: "صَبْرًا،",
        position: 13
      }
    ]
  }
} as VerseDisplayProps;
