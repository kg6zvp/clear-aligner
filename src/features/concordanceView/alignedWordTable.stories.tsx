import { Meta } from '@storybook/react';
import { AlignedWordTable, AlignedWordTableProps } from './alignedWordTable';
import { GridSortItem } from '@mui/x-data-grid';
import { useState } from 'react';
import { AlignedWord } from './structs';

const meta: Meta<typeof AlignedWordTable> = {
  title: 'Concordance View/AlignedWordTable',
  component: AlignedWordTable,
};

export default meta;

export const Default = (props: AlignedWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <AlignedWordTable
      {...props}
      sort={sortData}
      onChangeSort={onChangeSortDelegate}
    />
  );
};

Default.args = {
  alignedWords: [
    {
      id: 'the',
      frequency: 73_611,
      sourceTextId: 'srcId',
      targetTextId: 'tgtId',
      sourceWordTexts: [
        {
          text: 'the',
        },
      ],
      targetWordTexts: [
        {
          text: 'der',
        },
      ],
      alignments: [],
    } as AlignedWord,
  ],
} as AlignedWordTableProps;
