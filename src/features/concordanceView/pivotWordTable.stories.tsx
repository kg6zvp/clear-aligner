import { Meta } from '@storybook/react';
import { PivotWordTable, PivotWordTableProps } from './pivotWordTable';
import { useState } from 'react';
import { PivotWord } from './structs';
import { Paper } from '@mui/material';
import { GridSortItem } from '@mui/x-data-grid';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../structs';

const meta: Meta<typeof PivotWordTable> = {
  title: 'Concordance View/PivotWordTable',
  component: PivotWordTable,
};

export default meta;

const pivotWords: PivotWord[] = [
  {
    instances: [],
    side: AlignmentSide.TARGET,
    normalizedText: 'the',
    alignedWords: [
      {
        id: 'the',
        frequency: 73_611,
        sourceTextId: 'srcId',
        targetTextId: 'tgtId',
        sourceWordTexts: [
          {
            text: 'the',
            position: BCVWP.parseFromString(
              '010010010011'
            ).toTruncatedReferenceString(BCVWPField.Word),
          },
        ],
        targetWordTexts: [
          {
            text: 'der',
            position: BCVWP.parseFromString(
              '010010010011'
            ).toTruncatedReferenceString(BCVWPField.Word),
          },
        ],
        alignments: [],
      },
    ],
  },
  {
    instances: [],
    side: AlignmentSide.TARGET,
    normalizedText: 'and',
    alignedWords: [
      {
        id: 'and',
        frequency: 60_382,
        sourceTextId: 'srcId',
        targetTextId: 'tgtId',
        sourceWordTexts: [
          {
            text: 'and',
            position: BCVWP.parseFromString(
              '010010010011'
            ).toTruncatedReferenceString(BCVWPField.Word),
          },
        ],
        targetWordTexts: [
          {
            text: 'und',
            position: BCVWP.parseFromString(
              '010010010011'
            ).toTruncatedReferenceString(BCVWPField.Word),
          },
        ],
        alignments: [],
      },
    ],
  },
  {
    instances: [],
    side: AlignmentSide.TARGET,
    normalizedText: 'of',
    alignedWords: [],
  },
  {
    instances: [],
    side: AlignmentSide.TARGET,
    normalizedText: 'to',
    alignedWords: [],
  },
  {
    instances: [],
    side: AlignmentSide.TARGET,
    normalizedText: 'thus',
    alignedWords: [],
  },
  {
    instances: [],
    side: AlignmentSide.TARGET,
    normalizedText: 'so',
    alignedWords: [],
  },
  {
    instances: [],
    side: AlignmentSide.TARGET,
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
