import {Meta} from "@storybook/react";
import {PivotWordTable, PivotWordTableProps} from "./PivotWordTable";
import {useState} from "react";
import {SortData} from "./Structs";

const meta: Meta<typeof PivotWordTable> = {
  title: "PivotWordTable",
  component: PivotWordTable
};

export default meta;

export const Default = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: SortData) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return <PivotWordTable
    sort={sortData}
    pivotWords={props.pivotWords}
    onChooseWord={props.onChooseWord}
    onChangeSort={onChangeSortDelegate} />
}
Default.args = {
  sort: {
    field: 'frequency',
    direction: 'asc'
  },
  pivotWords: [
    {
      frequency: 73_611,
      pivotWord: 'the'
    },
    {
      frequency: 60_382,
      pivotWord: 'and'
    },
    {
      frequency: 40_029,
      pivotWord: 'of'
    },
    {
      frequency: 16_372,
      pivotWord: 'to'
    }
  ]
} as PivotWordTableProps

export const Loading = (props: PivotWordTableProps) => {
  const [sortData, setSortData] = useState(props.sort);

  const onChangeSortDelegate = (sortData: SortData) => {
    setSortData(sortData);
    props.onChangeSort(sortData);
  };

  return <PivotWordTable
    loading={props.loading}
    sort={sortData}
    pivotWords={props.pivotWords}
    onChooseWord={props.onChooseWord}
    onChangeSort={onChangeSortDelegate} />
}
Loading.args = {
  loading: true,
  sort: {
    field: 'frequency',
    direction: 'asc'
  },
  pivotWords: [
    {
      frequency: 73_611,
      pivotWord: 'the'
    },
    {
      frequency: 60_382,
      pivotWord: 'and'
    },
    {
      frequency: 40_029,
      pivotWord: 'of'
    },
    {
      frequency: 16_372,
      pivotWord: 'to'
    }
  ]
} as PivotWordTableProps
