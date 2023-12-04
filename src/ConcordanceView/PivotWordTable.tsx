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
import React from "react";
import {PivotWord, SortData} from "./Structs";
import {Box} from "@mui/system";

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

export interface PivotWordTableProps {
  loading?: boolean;
  sort: SortData;
  pivotWords: PivotWord[];
  onChooseWord: (word: PivotWord) => void;
  onChangeSort: (sortData: SortData) => void;
}

export const PivotWordTable = ({ loading, sort, onChangeSort, pivotWords, onChooseWord }: PivotWordTableProps) => {
  if (loading) {
    console.log('loading is true');
    return <Box sx={{ display: 'flex', margin: 'auto' }}>
      <CircularProgress sx={{ margin: 'auto' }}/>
    </Box>
  }
  return <TableContainer sx={{
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: '100%'
  }} >
    <Table stickyHeader>
      <TableHead>
        <TableRow>
          {columns.map((column) =>
            <SortedHeaderCell
              key={column.field}
              sort={sort}
              columnDefinition={column}
              onChangeSort={onChangeSort} />)}
        </TableRow>
      </TableHead>
      <TableBody>
        {pivotWords.map((row) =>
          <TableRow hover onClick={() => onChooseWord(row)} role={"link"} key={row.pivotWord}>
              <TableCell key={'frequency'}>
                {row.frequency ?? ''}
              </TableCell>
              <TableCell key={'pivotWord'}>
                {row.pivotWord ?? ''}
              </TableCell>
          </TableRow>)}
      </TableBody>
    </Table>
  </TableContainer>
}
