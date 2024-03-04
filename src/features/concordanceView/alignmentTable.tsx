import { AlignmentSide, Link } from '../../structs';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams, GridSortItem } from '@mui/x-data-grid';
import { IconButton, TableContainer } from '@mui/material';
import { Launch } from '@mui/icons-material';
import { createContext, useContext, useMemo } from 'react';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { findFirstRefFromLink } from '../../helpers/findFirstRefFromLink';
import { AlignedWord, PivotWord } from './structs';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { DataGridResizeAnimationFixes, DataGridScrollbarDisplayFix } from '../../styles/dataGridFixes';
import { VerseCell } from './alignmentTable/verseCell';

export interface AlignmentTableContextProps {
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
}

export const AlignmentTableContext = createContext({} as AlignmentTableContextProps);

export const RefCell = (
  row: GridRenderCellParams<Link, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  const refString = findFirstRefFromLink(row.row, tableCtx.wordSource);
  return (
    <BCVDisplay currentPosition={refString ? BCVWP.parseFromString(refString) : null} />
  );}

/**
 * Render the cell with the link button from an alignment row to the alignment editor at the corresponding verse
 * @param row rendering params for this Link entry
 */
export const LinkCell = (
  row: GridRenderCellParams<Link, any, any>
) => {
  const navigate = useNavigate();
  const tableCtx = useContext(AlignmentTableContext);
  const refString = findFirstRefFromLink(row.row, AlignmentSide.TARGET);
  return (
    <IconButton
      onClick={() =>
        navigate({
          pathname: '/',
          search: createSearchParams({
            ref: refString ? BCVWP.truncateTo(refString, BCVWPField.Verse ) : '',
            pivotWord: tableCtx?.pivotWord?.normalizedText || '',
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
    renderCell: (row: GridRenderCellParams<Link, any, any>) => (
      <RefCell {...row} />
    ),
  },
  {
    field: 'verse',
    headerName: 'Verse Text',
    flex: 1,
    sortable: false,
    renderCell: (row: GridRenderCellParams<Link, any, any>) => (
      <VerseCell {...row} />
    ),
  },
  {
    field: 'id',
    headerName: 'Link',
    sortable: false,
    renderCell: (row: GridRenderCellParams<Link, any, any>) => (
      <LinkCell {...row} />
    ),
  },
];

export interface AlignmentTableProps {
  sort: GridSortItem | null;
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord | null;
  alignments: Link[];
  onChangeSort: (sortData: GridSortItem | null) => void;
  chosenAlignmentLink: Link | null;
  onChooseAlignmentLink: (alignmentLink: Link) => void;
}

/**
 * The AlignmentTable displays a list of alignment Links and allows the user to navigate to that alignment link in the
 * alignment editor
 * @param sort current sort model for Material UI DataGrid
 * @param wordSource current word source
 * @param pivotWord the pivot word that's currently selected, corresponds to the alignment rows being displayed and the
 * currently selected aligned word
 * @param alignedWord the currently selected aligned word, corresponds to the alignment rows being displayed
 * @param alignments alignment links to be displayed in the table
 * @param onChangeSort callback for when the user changes the sort model
 * @param chosenAlignmentLink currently selected alignment link
 * @param onChooseAlignmentLink callback for when a user clicks on an alignment link
 */
export const AlignmentTable = ({
  sort,
  wordSource,
  pivotWord,
  alignedWord,
  alignments,
  onChangeSort,
  chosenAlignmentLink,
  onChooseAlignmentLink,
}: AlignmentTableProps) => {
  const initialPage = useMemo(() => {
    if (chosenAlignmentLink) {
      return (
        alignments.findIndex(
          (link) => link.id === chosenAlignmentLink.id
        ) / 20
      );
    }
    return 0;
  }, [chosenAlignmentLink, alignments]);


  const memoizedAlignments = useMemo(() => {
    const alignmentMap: Record<string, Link> = {};
    alignments.forEach(a => { if(a.id) alignmentMap[a.id] = a });
    return Object.values(alignmentMap);
  }, [alignments]);

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
          rowCount={memoizedAlignments.length}
          rowSelectionModel={
            chosenAlignmentLink?.id ? [chosenAlignmentLink.id] : undefined
          }
          rows={memoizedAlignments}
          columns={columns}
          getRowId={(row) => row.id}
          getRowHeight={(_) => 'auto'}
          sortModel={sort ? [sort] : []}
          onSortModelChange={(newSort) => {
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
          onRowClick={(clickEvent: GridRowParams<Link>) => {
            if (onChooseAlignmentLink) {
              onChooseAlignmentLink(clickEvent.row);
            }
          }}
        />
      </TableContainer>
    </AlignmentTableContext.Provider>
  );
};
