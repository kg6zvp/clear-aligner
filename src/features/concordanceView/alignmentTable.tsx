/**
 * This file contains the AlignmentTable component which is the third table
 * in the ConcordanceView component
 */
import { AlignmentSide, Link, LinkStatus } from '../../structs';
import {
  DataGrid,
  GridColDef,
  GridHeaderCheckbox,
  GridRenderCellParams,
  GridRowParams,
  GridSortItem,
  GridInputRowSelectionModel,
  GridRowSelectionModel
} from '@mui/x-data-grid';
import { CircularProgress, IconButton, Portal, TableContainer } from '@mui/material';
import { CancelOutlined, CheckCircleOutlined, FlagOutlined, Launch } from '@mui/icons-material';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import { findFirstRefFromLink } from '../../helpers/findFirstRefFromLink';
import { AlignedWord, PivotWord } from './structs';
import {
  DataGridOutlineFix,
  DataGridResizeAnimationFixes,
  DataGridScrollbarDisplayFix,
  DataGridTripleIconMarginFix
} from '../../styles/dataGridFixes';
import { VerseCell } from './alignmentTable/verseCell';
import { useLinksFromAlignedWord } from './useLinksFromAlignedWord';
import WorkbenchDialog from './workbenchDialog';
import { Box } from '@mui/system';
import { Link as LinkIcon } from '@mui/icons-material';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';

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
  );
};

/**
 * Render the cell with the link button from an alignment row to the alignment editor at the corresponding verse
 * @param row rendering params for this Link entry
 * @param onClick Callback on button click
 */
export const LinkCell = ({ row, onClick }: {
  row: GridRenderCellParams<Link, any, any>,
  onClick: (tableCtx: AlignmentTableContextProps, link: Link) => void;
}) => {
  const tableCtx = useContext(AlignmentTableContext);
  return (
    <IconButton onClick={() => onClick(tableCtx, row.row)}>
      <Launch />
    </IconButton>
  );
};

export interface StateCellProps {
  setSaveButtonDisabled: Function;
  state: Link;
  setLinksPendingUpdate: Function;
  linksPendingUpdate: Map<string, Link>;
  isRowSelected: boolean;
  alignmentTableControlPanelLinkState: LinkStatus | null;
}


/**
 * Render the cell with the Button Group of states
 */
export const StateCell = ({ setSaveButtonDisabled,
                            state,
                            setLinksPendingUpdate,
                            linksPendingUpdate,
                            isRowSelected,
                            alignmentTableControlPanelLinkState }:
                            StateCellProps) => {
  const [alignmentTableLinkState, setAlignmentTableLinkState]
    = React.useState<LinkStatus>(state.metadata.status);

  function handleSelect (value: string){
    const updatedLink = structuredClone(state);
    updatedLink.metadata.status = value as LinkStatus;
    // add updatedLink to the linksPendingUpdate Map
    setLinksPendingUpdate(new Map(linksPendingUpdate).set(updatedLink.id || "", updatedLink))
    setAlignmentTableLinkState(value as LinkStatus);
    setSaveButtonDisabled(false);
  }

  // if the state is updated via the AlignmentTableControl Panel, then update
  // the state here
  useEffect(() => {
    if(isRowSelected && alignmentTableControlPanelLinkState){
      setAlignmentTableLinkState(alignmentTableControlPanelLinkState)
    }
  }, [alignmentTableControlPanelLinkState, isRowSelected])

  return (
    <SingleSelectButtonGroup
      value={alignmentTableLinkState}
      sx={{ size: 'small' }}
      items={[
        {
          value: 'created',
          label: <LinkIcon />
        },
        {
          value: 'approved',
          label: <CheckCircleOutlined />
        },
        {
          value: 'rejected',
          label: <CancelOutlined />
        },
        {
          value: 'needsReview',
          label: <FlagOutlined />
        }
      ]}
      onSelect={handleSelect}

    />
  );
};

export interface AlignmentTableProps {
  wordSource: AlignmentSide;
  pivotWord?: PivotWord | null;
  alignedWord?: AlignedWord;
  chosenAlignmentLink: Link | null;
  onChooseAlignmentLink: (alignmentLink: Link) => void;
  updateAlignments: (resetState: boolean) => void;
  setSelectedRowsCount: Function,
  setSaveButtonDisabled: Function,
  setLinksPendingUpdate: Function,
  linksPendingUpdate: Map<string, Link>;
  container:  React.MutableRefObject<null>;
  setSelectedRows: Function;
  rowSelectionModel: GridInputRowSelectionModel;
  setRowSelectionModel: Function;
  alignmentTableControlPanelLinkState: LinkStatus | null;
  setUpdatedSelectedRows: Function;
}

/**
 * The AlignmentTable displays a list of alignment Links and allows the user to navigate to that alignment link in the
 * alignment editor
 * @param wordSource current word source
 * @param pivotWord the pivot word that's currently selected, corresponds to the alignment rows being displayed and the
 * currently selected aligned word
 * @param alignedWord the currently selected aligned word, corresponds to the alignment rows being displayed
 * @param chosenAlignmentLink currently selected alignment link
 * @param onChooseAlignmentLink callback for when a user clicks on an alignment link
 * @param updateAlignments callback used when closing the WorkBenchDialog Dialog
 * @param setSelectedRowsCount callback to update the count of currently selected rows in the table
 * @param setSaveButtonDisabled callback to control the status of the Save button
 * @param setLinksPendingUpdate callback to add an updated Link to the array of Links pending an update
 * @param linksPendingUpdate Array of Links pending an update
 * @param container Reference to the container utilized by Portal component
 * @param setSelectedRows callback to update the state with what rows are currently selected
 * @param rowSelectionModel prop that reflects what rows in the table are currently selected
 * @param setRowSelectionModel callback to update what rows are currently selected
 * @param alignmentTableControlPanelLinkState prop passed down to update selected links in bulk
 * @param setUpdatedSelectedRows callback to update the updatedSelectedRows
 */
export const AlignmentTable = ({
                                 wordSource,
                                 pivotWord,
                                 alignedWord,
                                 chosenAlignmentLink,
                                 onChooseAlignmentLink,
                                 updateAlignments,
                                 setSelectedRowsCount,
                                 setSelectedRows,
                                 setSaveButtonDisabled,
                                 setLinksPendingUpdate,
                                 linksPendingUpdate,
                                 container,
                                 rowSelectionModel,
                                 setRowSelectionModel,
                                 alignmentTableControlPanelLinkState,
                                 setUpdatedSelectedRows
                               }: AlignmentTableProps) => {
  const [selectedAlignment, setSelectedAlignment] = useState<BCVWP | null>(null);
  const [sort, onChangeSort] = useState<GridSortItem | null>({
    field: 'id',
    sort: 'desc'
  } as GridSortItem);

  const alignments = useLinksFromAlignedWord(alignedWord, sort);

  const loading: boolean = useMemo(
    () => !!alignedWord && !alignments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alignedWord, alignments, alignments?.length]);

  const initialPage = useMemo(() => {
    if (chosenAlignmentLink && alignments) {
      return (
        alignments.findIndex(
          (link) => link.id === chosenAlignmentLink.id
        ) / 20
      );
    }
    return 0;
  }, [chosenAlignmentLink, alignments]);

  function handleRowSelectionModelChange(rowSelectionModel: GridRowSelectionModel){
    setRowSelectionModel(rowSelectionModel);
    setSelectedRowsCount(rowSelectionModel.length);
    const selectedIDs = new Set(rowSelectionModel);
    const selectedRows = alignments?.filter((row) => selectedIDs.has(row?.id || ''));
    setSelectedRows(selectedRows);

    // update the state of all the currently selected rows in bulk
    if(alignmentTableControlPanelLinkState) {
      setUpdatedSelectedRows(selectedRows?.map((row) => (
        {
          ...row,
          metadata: {
            ...row.metadata,
            status: alignmentTableControlPanelLinkState,
          }
        })))
    }
  }

  const columns: GridColDef[] = [
    {
      field: "__check__",
      renderHeader: (params) => (
          <Portal container={() => container?.current}>
            <GridHeaderCheckbox {...params} />
          </Portal>
      ),
      type: 'checkboxSelection',
      disableColumnMenu: true,
      resizable: false,
      disableReorder: true,
      disableExport: true,
      filterable: false,
      sortable: false,
      width: 20,
    },
    {
      field: 'state',
      headerName: 'State',
      sortable: false,
      width: 175,
      disableColumnMenu: true,
      renderCell: row => {
        return (<StateCell
          setSaveButtonDisabled={setSaveButtonDisabled}
          state={row.row}
          isRowSelected={row.api.isRowSelected(row.id)}
          setLinksPendingUpdate={setLinksPendingUpdate}
          linksPendingUpdate={linksPendingUpdate}
          alignmentTableControlPanelLinkState={alignmentTableControlPanelLinkState || null}
        />)
      }
    },
    {
      field: 'ref',
      headerName: 'Ref',
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <RefCell {...row} />
      )
    },
    {
      field: 'verse',
      headerName: 'Verse Text',
      flex: 1,
      sortable: false,
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <VerseCell {...row} />
      )
    },
    {
      field: 'id',
      headerName: 'Link',
      sortable: false,
      renderCell: (row: GridRenderCellParams<Link, any, any>) => (
        <LinkCell row={row} onClick={() => {
          setSelectedAlignment(BCVWP.parseFromString(findFirstRefFromLink(row.row, AlignmentSide.TARGET) ?? ''));
        }} />
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', margin: 'auto' }}>
        <CircularProgress sx={{
          display: 'flex',
          '.MuiLinearProgress-bar': {
            transition: 'none'
          }
        }} />
      </Box>
    );
  }

  return (
    <AlignmentTableContext.Provider
      value={{
        pivotWord,
        alignedWord,
        wordSource
      }}
    >
      <TableContainer
        sx={{
          width: '100%',
          height: '100%',
          '.MuiTableContainer-root::-webkit-scrollbar': {
            width: 0
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', margin: 'auto' }}>
            <CircularProgress sx={{ margin: 'auto' }} />
          </Box>
        ) : (
          <>
            <DataGrid
              sx={{
                width: '100%',
                ...DataGridScrollbarDisplayFix,
                ...DataGridResizeAnimationFixes,
                ...DataGridTripleIconMarginFix,
                ...DataGridOutlineFix,
              }}
              rowSelection={true}
              rowCount={alignments?.length ?? 0}
              rows={alignments ?? []}
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
                  paginationModel: { page: initialPage, pageSize: 20 }
                }
              }}
              pageSizeOptions={[20]}
              onRowClick={(clickEvent: GridRowParams<Link>) => {
                if (onChooseAlignmentLink) {
                  onChooseAlignmentLink(clickEvent.row);
                }
              }}
              checkboxSelection={true}
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={handleRowSelectionModelChange}
              hideFooterSelectedRowCount
              disableRowSelectionOnClick
            />
          </>
        )}
      </TableContainer>
      <WorkbenchDialog
        alignment={selectedAlignment}
        setAlignment={setSelectedAlignment}
        updateAlignments={updateAlignments}
      />
    </AlignmentTableContext.Provider>
  );
};
