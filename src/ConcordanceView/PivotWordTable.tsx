import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel
} from "@mui/material";
import React, {useMemo} from "react";
import {PivotWord, SortData} from "./Structs";
import {Box} from "@mui/system";
import {DataGrid, GridRow} from "@mui/x-data-grid";

interface ColumnDefinition {
  field: string;
  headerName: string;
}

const columns: ColumnDefinition[] = [
  {
    field: 'frequency',
    headerName: 'Frequency'
  },
  {
    field: 'pivotWord',
    headerName: 'PivotWord'
  }
]

export interface SortedHeaderCellProps {
  sort: SortData;
  columnDefinition: ColumnDefinition;
  onChangeSort: (sortData: SortData) => void;
}

export const SortedHeaderCell = ({ sort, columnDefinition, onChangeSort }: SortedHeaderCellProps) => {
  const isSortedField = sort.field === columnDefinition.field;
  return <TableCell
    align={'center'}
    key={columnDefinition.field}
    {...isSortedField ? { sortDirection: sort.direction } : {}} >
    <TableSortLabel
      active={isSortedField}
      direction={sort.direction}
      onClick={() => onChangeSort({
        field: columnDefinition.field,
        direction: isSortedField ?
          sort.direction === 'asc' ? 'desc' : 'asc'
          :
          'asc'
      })}>
      {columnDefinition.headerName}
    </TableSortLabel>
  </TableCell>
}

export interface PivotWordRowProps {
  row: PivotWord;
  onChooseWord: (word: PivotWord) => void;
}

export const PivotWordRow = React.memo(({ row, onChooseWord }: PivotWordRowProps) =>
    <TableRow hover onClick={() => onChooseWord(row)} role={"link"} key={row.pivotWord}>
      <TableCell key={'frequency'}>
        {row.frequency ?? ''}
      </TableCell>
      <TableCell key={'pivotWord'}>
        {row.pivotWord ?? ''}
      </TableCell>
    </TableRow>)

export interface PivotWordTableProps {
  loading?: boolean;
  sort: SortData;
  pivotWords: PivotWord[];
  chosenWord?: PivotWord;
  onChooseWord: (word: PivotWord) => void;
  onChangeSort: (sortData: SortData) => void;
}

export const PivotWordTable = ({ loading, sort, onChangeSort, pivotWords, chosenWord, onChooseWord }: PivotWordTableProps) => {
  const rows = useMemo(() =>
    pivotWords.reduce((pivotWordObj, currentValue) => {
      pivotWordObj[currentValue.pivotWord] = currentValue;
      return pivotWordObj;
    }, {} as { [key: string]: PivotWord }), [pivotWords]);
  if (loading) {
    console.log('loading is true');
    return <Box sx={{ display: 'flex', margin: 'auto' }}>
      <CircularProgress sx={{ margin: 'auto' }}/>
    </Box>
  }
  return <TableContainer sx={{
    width: '100%',
    height: '100%',
  }} >
    <DataGrid
        sx={{
          overflowY: 'scroll'
        }}
        rowSelection={true}
        rowSelectionModel={chosenWord?.pivotWord}
        rows={pivotWords}
        columns={columns}
        getRowId={(row) => row.pivotWord}
        slotProps={{
        }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 20 },
          },
        }}
        pageSizeOptions={[20, 50]}
        onRowClick={(row) => onChooseWord(rows[row.id])}
    />
  </TableContainer>
}
