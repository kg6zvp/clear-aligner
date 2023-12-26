import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridSortItem,
} from '@mui/x-data-grid';
import { AlignedWord } from './structs';
import { TableContainer } from '@mui/material';
import React, { useMemo } from 'react';

const columns: GridColDef[] = [
  {
    field: 'frequency',
    headerName: 'Frequency',
    flex: 1,
  },
  {
    field: 'sourceWordTexts',
    headerName: 'Source',
    flex: 1,
  },
  {
    field: 'targetWordTexts',
    headerName: 'Target',
    flex: 1,
  },
];

const columnsWithGloss: GridColDef[] = [
  ...columns,
  {
    field: 'gloss',
    headerName: 'Gloss',
    flex: 1,
  },
];

export interface AlignedWordTableProps {
  sort: GridSortItem | null;
  alignedWords: AlignedWord[];
  chosenAlignedWord?: AlignedWord;
  onChooseAlignedWord: (alignedWord: AlignedWord) => void;
  onChangeSort: (sortData: GridSortItem | null) => void;
}

export const AlignedWordTable = ({
  sort,
  alignedWords,
  chosenAlignedWord,
  onChooseAlignedWord,
  onChangeSort,
}: AlignedWordTableProps) => {
  const rows = useMemo(
    () =>
      alignedWords.reduce((accumulator, row) => {
        accumulator[row.id] = row;
        return accumulator;
      }, {} as { [key: string]: AlignedWord }),
    [alignedWords]
  );

  const hasGlossData = alignedWords.some(
    (alignedWord: AlignedWord) => !!alignedWord.gloss
  );

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
        rowSelectionModel={chosenAlignedWord?.id}
        rows={alignedWords}
        columns={hasGlossData ? columnsWithGloss : columns}
        getRowId={(row) => row.id}
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
        onRowClick={(row: GridRowParams<AlignedWord>) =>
          onChooseAlignedWord(rows[row.id])
        }
        //onRowSelectionModelChange={(rowSelectionModel, details) => { }}
        isRowSelectable={({
          row: { alignments },
        }: GridRowParams<AlignedWord>) =>
          !!alignments && (alignments?.length || 0) > 0
        }
      />
    </TableContainer>
  );
};
