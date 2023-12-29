import { Corpus, Link, DisplayableLink, Verse } from '../../structs';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridSortItem,
} from '@mui/x-data-grid';
import { IconButton, TableContainer } from '@mui/material';
import { Launch } from '@mui/icons-material';
import { VerseDisplay } from '../corpus/verseDisplay';
import { WordSource } from './concordanceView';
import { createContext, useContext, useMemo } from 'react';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import _ from 'lodash';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { findFirstRefFromLink } from '../../helpers/findFirstRefFromLink';
import { AlignedWord, PivotWord } from './structs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import findWord from '../../helpers/findWord';
import {DataGridResizeAnimationFixes, DataGridScrollbarDisplayFix} from "../../styles/dataGridFixes";

export interface AlignmentTableContextProps {
  wordSource: WordSource;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
}

const AlignmentTableContext = createContext({} as AlignmentTableContextProps);

export const VerseCell = (
  row: GridRenderCellParams<DisplayableLink, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  const corpus =
    tableCtx.wordSource === 'source'
      ? row.row?.sourceCorpus
      : row.row?.targetCorpus;
  const verses: Verse[] = _.uniqWith(
    (tableCtx.wordSource === 'source' ? row.row?.sources : row.row?.targets)
      ?.filter(BCVWP.isValidString)
      .map(BCVWP.parseFromString)
      .map((ref) => ref.toTruncatedReferenceString(BCVWPField.Verse)),
    _.isEqual
  ).map((ref) => corpus?.wordsByVerse[ref]);
  return (
    <>
      {verses.map((verse: Verse) => (
        <VerseDisplay
          key={verse?.bcvId?.toReferenceString() ?? ''}
          readonly
          verse={verse}
        />
      ))}
    </>
  );
};

export const LinkCell = (
  row: GridRenderCellParams<DisplayableLink, any, any>
) => {
  const navigate = useNavigate();
  const tableCtx = useContext(AlignmentTableContext);
  return (
    <IconButton
      onClick={() =>
        navigate({
          pathname: '/',
          search: createSearchParams({
            ref:
              findFirstRefFromLink(row.row)?.toTruncatedReferenceString(
                BCVWPField.Verse
              ) ?? '',
            pivotWord: tableCtx?.pivotWord?.pivotWord || '',
            alignedWord: tableCtx?.alignedWord?.id || '',
            alignmentLink: row.row.id ?? '',
          }).toString(),
        })
      }
    >
      <Launch />
    </IconButton>
  );
};

const columns: GridColDef[] = [
  {
    field: 'state',
    headerName: 'State',
  },
  {
    field: 'sources',
    headerName: 'Ref',
    renderCell: (row: GridRenderCellParams<DisplayableLink, any, any>) => (
      <BCVDisplay currentPosition={findFirstRefFromLink(row.row)} />
    ),
  },
  {
    field: 'verse',
    headerName: 'Verse Text',
    flex: 1,
    renderCell: (row: GridRenderCellParams<DisplayableLink, any, any>) => (
      <VerseCell {...row} />
    ),
  },
  {
    field: 'id',
    headerName: 'Link',
    renderCell: (row: GridRenderCellParams<DisplayableLink, any, any>) => (
      <LinkCell {...row} />
    ),
  },
];

export interface AlignmentTableProps {
  sort: GridSortItem | null;
  wordSource: WordSource;
  sourceCorpus: Corpus | null;
  targetCorpus: Corpus | null;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
  alignments: Link[];
  onChangeSort: (sortData: GridSortItem | null) => void;
  chosenAlignmentLink: Link | null;
  onChooseAlignmentLink: (alignmentLink: DisplayableLink) => void;
}

export const AlignmentTable = ({
  sort,
  wordSource,
  sourceCorpus,
  targetCorpus,
  pivotWord,
  alignedWord,
  alignments,
  onChangeSort,
  chosenAlignmentLink,
  onChooseAlignmentLink,
}: AlignmentTableProps) => {
  const displayableLinks: DisplayableLink[] = useMemo(() => {
    return alignments && sourceCorpus && targetCorpus
      ? alignments.map(
          (link) =>
            ({
              ...link,
              sourceCorpus,
              targetCorpus,
              sourceWords: link.sources
                .map(BCVWP.parseFromString)
                .map((ref) => findWord([sourceCorpus!], ref)?.text),
              targetWords: link.targets
                .map(BCVWP.parseFromString)
                .map((ref) => findWord([targetCorpus!], ref)?.text),
            } as DisplayableLink)
        )
      : [];
  }, [alignments, sourceCorpus, targetCorpus]);

  const initialPage = useMemo(() => {
    if (chosenAlignmentLink && displayableLinks) {
      return (
        displayableLinks.findIndex(
          (link) => link.id === chosenAlignmentLink.id
        ) / 20
      );
    }
    return 0;
  }, [chosenAlignmentLink, displayableLinks]);

  return (
    <AlignmentTableContext.Provider
      value={{
        pivotWord,
        alignedWord,
        wordSource,
      }}
    >
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
            chosenAlignmentLink?.id ? [chosenAlignmentLink.id] : undefined
          }
          rows={displayableLinks}
          columns={columns}
          getRowId={(row) => row.id}
          getRowHeight={(_) => 'auto'}
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
          onRowClick={(clickEvent: GridRowParams<DisplayableLink>) => {
            if (onChooseAlignmentLink) {
              onChooseAlignmentLink(clickEvent.row);
            }
          }}
        />
      </TableContainer>
    </AlignmentTableContext.Provider>
  );
};
