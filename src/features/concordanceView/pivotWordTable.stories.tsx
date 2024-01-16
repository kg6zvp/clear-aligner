import { Meta } from '@storybook/react';
import { PivotWordTable, PivotWordTableProps } from './pivotWordTable';
import { useState } from 'react';
import { PivotWord } from './structs';
import { Paper } from '@mui/material';
import { GridSortItem } from '@mui/x-data-grid';

const meta: Meta<typeof PivotWordTable> = {
  title: 'Concordance View/PivotWordTable',
  component: PivotWordTable,
};

export default meta;

const pivotWords: PivotWord[] = [
  {
    frequency: 73_611,
    normalizedText: 'the',
    alignedWords: [
      {
        id: 'the',
        frequency: 73_611,
        sourceTextId: 'srcId',
        targetTextId: 'tgtId',
        sourceWordTexts: [{ text: 'the' }],
        targetWordTexts: [{ text: 'der' }],
        alignments: [],
      },
    ],
  },
  {
    frequency: 60_382,
    normalizedText: 'and',
    alignedWords: [
      {
        id: 'and',
        frequency: 60_382,
        sourceTextId: 'srcId',
        targetTextId: 'tgtId',
        sourceWordTexts: [{ text: 'and' }],
        targetWordTexts: [{ text: 'und' }],
        alignments: [],
      },
    ],
  },
  {
    frequency: 40_029,
    normalizedText: 'of',
    alignedWords: [],
  },
  {
    frequency: 16_372,
    normalizedText: 'to',
    alignedWords: [],
  },
  {
    frequency: 5_000,
    normalizedText: 'thus',
    alignedWords: [],
  },
  {
    frequency: 4_999,
    normalizedText: 'so',
    alignedWords: [],
  },
  {
    frequency: 4_998,
    normalizedText: 'as',
    alignedWords: [],
  },
];

export const Default = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <PivotWordTable
      sort={sortData}
      pivotWords={props.pivotWords}
      onChooseWord={props.onChooseWord}
      onChangeSort={onChangeSortDelegate}
    />
  );
};
Default.args = {
  sort: {
    field: 'frequency',
    sort: 'asc',
  },
  pivotWords: pivotWords,
} as PivotWordTableProps;

export const WithScrollbar = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <Paper
      sx={{
        height: '200px',
      }}
    >
      <PivotWordTable
        sort={sortData}
        pivotWords={props.pivotWords}
        onChooseWord={props.onChooseWord}
        onChangeSort={onChangeSortDelegate}
      />
    </Paper>
  );
};
WithScrollbar.args = {
  sort: {
    field: 'frequency',
    sort: 'asc',
  },
  pivotWords: pivotWords,
} as PivotWordTableProps;

export const Loading = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <PivotWordTable
      loading={props.loading}
      sort={sortData}
      pivotWords={props.pivotWords}
      onChooseWord={props.onChooseWord}
      onChangeSort={onChangeSortDelegate}
    />
  );
};
Loading.args = {
  loading: true,
  sort: {
    field: 'frequency',
    sort: 'asc',
  },
  pivotWords: pivotWords,
} as PivotWordTableProps;
