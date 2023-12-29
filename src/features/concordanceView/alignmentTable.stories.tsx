import { Meta } from '@storybook/react';
import { AlignmentTable, AlignmentTableProps } from './alignmentTable';
import { useState } from 'react';
import { GridSortItem } from '@mui/x-data-grid';

const meta: Meta<typeof AlignmentTable> = {
  title: 'Concordance View/AlignmentTable',
  component: AlignmentTable,
};

export default meta;

export const Default = (props: AlignmentTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: GridSortItem | null) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return (
    <AlignmentTable
      {...props}
      sort={sortData}
      alignments={props.alignments}
      onChangeSort={onChangeSortDelegate}
    />
  );
};

Default.args = {
  alignments: [
    {
      id: '01',
      sources: ['12345678'],
      targets: ['12345678'],
    },
    {
      id: '02',
      sources: ['23456781', '34567812'],
      targets: ['23456781', '34567812'],
    },
    {
      id: '03',
      sources: ['45678123'],
      targets: ['45678123'],
    },
  ],
} as AlignmentTableProps;
