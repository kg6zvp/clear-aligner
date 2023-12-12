import {
  CircularProgress,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import React, { useMemo } from 'react';
import { PivotWord } from './structs';
import { Box } from '@mui/system';
import { DataGrid, GridColDef, GridSortItem } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  {
    field: 'frequency',
    headerName: 'Frequency',
    flex: 1,
  },
  {
    field: 'pivotWord',
    headerName: 'Pivot Word',
    flex: 1,
  },
];

export interface PivotWordRowProps {
  row: PivotWord;
  onChooseWord: (word: PivotWord) => void;
}

export const PivotWordRow = React.memo(
  ({ row, onChooseWord }: PivotWordRowProps) => (
    <TableRow
      hover
      onClick={() => onChooseWord(row)}
      role={'link'}
      key={row.pivotWord}
    >
      <TableCell key={'frequency'}>{row.frequency ?? ''}</TableCell>
      <TableCell key={'pivotWord'}>{row.pivotWord ?? ''}</TableCell>
    </TableRow>
  )
);

export interface PivotWordTableProps {
  loading?: boolean;
  sort: GridSortItem | null;
  pivotWords: PivotWord[];
  chosenWord?: PivotWord;
  onChooseWord: (word: PivotWord) => void;
  onChangeSort: (sortData: GridSortItem | null) => void;
}

export const PivotWordTable = ({
  loading,
  sort,
  onChangeSort,
  pivotWords,
  chosenWord,
  onChooseWord,
}: PivotWordTableProps) => {
  const rows = useMemo(
    () =>
      pivotWords.reduce((pivotWordObj, currentValue) => {
        pivotWordObj[currentValue.pivotWord] = currentValue;
        return pivotWordObj;
      }, {} as { [key: string]: PivotWord }),
    [pivotWords]
  );
  if (loading) {
    return (
      <Box sx={{ display: 'flex', margin: 'auto' }}>
        <CircularProgress sx={{ margin: 'auto' }} />
      </Box>
    );
  }
  return (
    <TableContainer
      sx={{
        width: '100%',
        height: '100%',
        '.MuiTableContainer-root::-webkit-scrollbar': {
          width: 0,
        },
      }}
    >
      <DataGrid
        sx={{
          width: '100%',
          '.MuiTablePagination-root::-webkit-scrollbar': {
            width: 0,
          },
        }}
        rowSelection={true}
        rowSelectionModel={chosenWord?.pivotWord}
        rows={pivotWords}
        columns={columns}
        getRowId={(row) => row.pivotWord}
        sortModel={sort ? [sort] : []}
        onSortModelChange={(newSort, details) => {
          if (!newSort || newSort.length < 1) {
            onChangeSort(sort);
          }
          onChangeSort(newSort[0] /*only single sort is supported*/);
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
  );
};
