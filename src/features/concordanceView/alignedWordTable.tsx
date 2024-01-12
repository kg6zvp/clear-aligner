import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridSortItem,
} from '@mui/x-data-grid';
import { AlignedWord, LocalizedWordEntry } from './structs';
import { TableContainer } from '@mui/material';
import React, { useMemo } from 'react';
import {
  DataGridResizeAnimationFixes,
  DataGridScrollbarDisplayFix,
} from '../../styles/dataGridFixes';
import { LocalizedTextDisplay } from '../localizedTextDisplay';

const renderWords = (words: LocalizedWordEntry[]) => {
  switch (words.length) {
    case 0:
      return <></>;
    case 1:
      return (
        <LocalizedTextDisplay
          children={words[0].text}
          languageInfo={words[0].languageInfo}
        />
      );
    default:
      return (
        <ul>
          {words.map((wordEntry) => (
            <li>
              <LocalizedTextDisplay
                children={wordEntry.text}
                languageInfo={wordEntry.languageInfo}
              />
            </li>
          ))}
        </ul>
      );
  }
};

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
    renderCell: ({ row }: GridRenderCellParams<AlignedWord, any, any>) =>
      renderWords(row.sourceWordTexts),
  },
  {
    field: 'targetWordTexts',
    headerName: 'Target',
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams<AlignedWord, any, any>) =>
      renderWords(row.targetWordTexts),
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
  chosenAlignedWord?: AlignedWord | null;
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
  const hasGlossData = useMemo(
    () => alignedWords.some((alignedWord: AlignedWord) => !!alignedWord.gloss),
    [alignedWords]
  );
  const initialPage = useMemo(() => {
    if (chosenAlignedWord && alignedWords) {
      return alignedWords.indexOf(chosenAlignedWord) / 20;
    }
    return 0;
  }, [chosenAlignedWord, alignedWords]);

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
          ...DataGridScrollbarDisplayFix,
          ...DataGridResizeAnimationFixes,
        }}
        rowSelection={true}
        rowSelectionModel={
          chosenAlignedWord?.id ? [chosenAlignedWord.id] : undefined
        }
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
            paginationModel: { page: initialPage, pageSize: 20 },
          },
        }}
        pageSizeOptions={[20, 50]}
        onRowClick={(clickEvent: GridRowParams<AlignedWord>) => {
          if (onChooseAlignedWord) {
            onChooseAlignedWord(clickEvent.row);
          }
        }}
        isRowSelectable={({
          row: { alignments },
        }: GridRowParams<AlignedWord>) =>
          !!alignments && (alignments?.length || 0) > 0
        }
      />
    </TableContainer>
  );
};
