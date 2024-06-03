/**
 * This file contains the ConcordanceView component which is one of the top level
 * modes of the CA application
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlignmentSide, Link, LinkStatus } from '../../structs';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, PivotWord } from './structs';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridInputRowSelectionModel, GridSortItem } from '@mui/x-data-grid';
import { useBlocker, useSearchParams, Location, Blocker } from 'react-router-dom';
import { usePivotWords } from './usePivotWords';
import { resetTextSegments } from '../../state/alignment.slice';
import { useAppDispatch } from '../../app/index';
import { CancelOutlined, CheckCircleOutlined, FlagOutlined, Link as LinkIcon } from '@mui/icons-material';
import { useSaveLink } from '../../state/links/tableManager';
import uuid from 'uuid-random';
import useConfirm from '../../hooks/useConfirm';

export type PivotWordFilter = 'aligned' | 'all';

interface SaveChangesConfirmationViaRouterProps{
  blocker: Blocker;
}

// Unsaved Changes Confirmation Modal triggered by Navigation Change
const SaveChangesConfirmationViaRouter = ({blocker}: SaveChangesConfirmationViaRouterProps) => {
  if (!blocker){
    return
  }
  if(blocker.proceed && blocker.reset) {
    return (
      <Dialog open={blocker.state === 'blocked'}>
        <DialogContent>
          Changes will be lost if you navigate away. Continue?
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => blocker.proceed()} variant={"contained"}>Continue </Button>
          <Button onClick={ () => blocker.reset()} variant={"contained"}>Cancel </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

export interface AlignmentTableControlPanelProps {
  saveButtonDisabled?: boolean;
  setSaveButtonDisabled: Function;
  setSelectedRowsCount: Function;
  selectedRowsCount: number;
  linksPendingUpdate: Map<string, Link>;
  container:  React.MutableRefObject<null>;
  setSelectedRows: Function;
  selectedRows: Link[];
  setUpdatedSelectedRows: Function;
  updatedSelectedRows: Link[];
  setLinksPendingUpdate: Function;
  setRowSelectionModel: Function;
  alignmentTableControlPanelLinkState: LinkStatus | null;
  setAlignmentTableControlPanelLinkState: Function;
}

export const AlignmentTableControlPanel = ({
                                             saveButtonDisabled,
                                             setSaveButtonDisabled,
                                             selectedRowsCount,
                                             linksPendingUpdate,
                                             container,
                                             setSelectedRows,
                                             setSelectedRowsCount,
                                             selectedRows,
                                             setUpdatedSelectedRows,
                                             updatedSelectedRows,
                                             setLinksPendingUpdate,
                                             setRowSelectionModel,
                                             alignmentTableControlPanelLinkState,
                                             setAlignmentTableControlPanelLinkState
                                           }: AlignmentTableControlPanelProps) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isButtonGroupDisabled, setIsButtonGroupDisabled ] = React.useState(true);
  const [linkSaveState, setLinkSaveState] = useState<{
    link?: Link[],
    saveKey?: string,
  }>();

  useSaveLink(linkSaveState?.link, linkSaveState?.saveKey);

  const handleClose = () => {
    setIsDialogOpen(false)
  }

  // control if the button group is enabled
  useEffect( () => {
    if(selectedRowsCount > 0) {
      setIsButtonGroupDisabled(false)
    }
    else if(selectedRowsCount === 0){
      setIsButtonGroupDisabled(true)
    }
  }, [selectedRowsCount])

  // iterate through all selectedRows and update linksPendingUpdate
  useEffect( () => {
    updatedSelectedRows?.forEach((row) => {
      setLinksPendingUpdate(linksPendingUpdate.set(row.id || "", row))
    })

  },[updatedSelectedRows, linksPendingUpdate, setLinksPendingUpdate])

  const handleSaveLinkStatus = () => {
    setIsDialogOpen(true);
  };

  // fires when user picks a new state from the control panel
  const handleOnSelect = (value: string) => {
    setAlignmentTableControlPanelLinkState(value);
    setSaveButtonDisabled(false)

    // update the state of all the currently selected rows in bulk
    setUpdatedSelectedRows(selectedRows?.map((row) => (
      {
        ...row,
        metadata: {
          ...row.metadata,
          status: value as LinkStatus,
        }
      })))
  }

  // Take the map, transform it to an array, then pass it to the save function
  const handleSave = () => {
    const linksToSave = [...linksPendingUpdate.values()];
    setLinkSaveState({
      link: linksToSave,
      saveKey: uuid()
    });

    // reset things back to empty and 0
    setRowSelectionModel([])
    setSelectedRows([]);
    setUpdatedSelectedRows([]);
    setSelectedRowsCount(0);
    setSaveButtonDisabled(true);
    setLinksPendingUpdate(new Map());
    setAlignmentTableControlPanelLinkState("");
    handleClose();
  }

  const DisplayItemsSelectedCount = () => {
    if (selectedRowsCount === 0) {
      return null;
    } else if (selectedRowsCount === 1) {
      return (
        <Typography component="span" alignSelf={'center'} fontSize={13}>
          <Box sx={{ fontWeight: 'bold' }} display="inline"> {selectedRowsCount} item</Box> selected
        </Typography>
      );
    } else {
      return (
        <Typography component="span" alignSelf={'center'} fontSize={13}>
          <Box sx={{ fontWeight: 'bold' }} display="inline"> {selectedRowsCount} items</Box> selected
        </Typography>
      );
    }
  };

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack
          justifyContent="left"
          style={{ marginBottom: '10px' }}
          direction="row"
        >
          <div ref={container}>
            {/*This is where the checkbox gets inserted via Portal*/}
          </div>
          <Typography component="span" alignSelf={'center'}>
            <Box sx={{ fontWeight: 'bold' }}> Alignments</Box>
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="right"
          style={{ marginBottom: '10px' }}
        >
          <DisplayItemsSelectedCount />
          <Divider orientation="vertical" />
          <ButtonGroup>
            <SingleSelectButtonGroup
              disabled={isButtonGroupDisabled}
              value={alignmentTableControlPanelLinkState || undefined}
              sx={{ size: 'small', width: '200px' }}
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
              onSelect={(value) => handleOnSelect(value)}
            />
          </ButtonGroup>
          <ButtonGroup>
            <Button
              variant="contained"
              sx={{ textTransform: 'none' }}
              disabled={saveButtonDisabled}
              onClick={handleSaveLinkStatus}
            >
              SAVE
            </Button>
          </ButtonGroup>
        </Stack>
        <Dialog maxWidth="lg"
                open={isDialogOpen}
                disableEscapeKeyDown={true}
        >
          <DialogContent sx={{ height: '100%', width: '100%' }}>
            Save {linksPendingUpdate.size} {linksPendingUpdate.size === 1 ? `change` : `changes`}?
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSave} variant={"contained"}>Yes</Button>
            <Button onClick={handleClose} variant={"contained"}>No</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </>
  );
};


export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  const dispatch = useAppDispatch();
  const [selectedRowsCount, setSelectedRowsCount] = React.useState(0);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [saveButtonDisabled, setSaveButtonDisabled] = React.useState(true);
  const [rowSelectionModel, setRowSelectionModel ] = React.useState<GridInputRowSelectionModel>([]);
  const [alignmentTableControlPanelLinkState, setAlignmentTableControlPanelLinkState] = React.useState<LinkStatus>();
  /**
   * pivot words
   */
  const [wordSource, setWordSource] = useState('targets' as AlignmentSide);
  const [wordFilter, setWordFilter] = useState('all' as PivotWordFilter);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem | null);
  const [linksPendingUpdate, setLinksPendingUpdate] = useState<Map<string, Link>>(new Map());
  const [updatedSelectedRows, setUpdatedSelectedRows] = React.useState<Link[]>([])
  const { pivotWords } = usePivotWords(wordSource, wordFilter, pivotWordSortData);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loading = useMemo(() => !!pivotWords, [pivotWords, pivotWords?.length]);

  const [selectedPivotWord, setSelectedPivotWord] = useState<
    PivotWord | undefined
  >();
  const [alignedWordSortData, setAlignedWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem | null);
  const [selectedAlignedWord, setSelectedAlignedWord] = useState(
    null as AlignedWord | null
  );
  const [selectedAlignmentLink, setSelectedAlignmentLink] = useState(
    null as Link | null
  );

  // container is used for the Portal component to transport the checkbox from
  // the DataGrid to the AlignmentTableControlPanel
  const container = React.useRef(null);

  const [ getSaveChangesConfirmation, SaveChangesConfirmation ] = useConfirm();

  const handleUpdateSelectedAlignedWord = useCallback(async (alignedWord: AlignedWord | null) => {
      if (linksPendingUpdate.size > 0 && alignedWord !== null ) {
        // open modal asking if users want to continue or not
        const status = await getSaveChangesConfirmation('Changes will be lost if you navigate away. Continue?');
        // if user clicks cancel: early return, otherwise proceed
        if (status === false) {
          return;
        }
      }
      setSelectedAlignedWord(alignedWord);
      setSelectedAlignmentLink(null);
      setSaveButtonDisabled(true);
      setUpdatedSelectedRows([]);
      setLinksPendingUpdate(new Map());
      setAlignmentTableControlPanelLinkState("" as LinkStatus);
    },
    [getSaveChangesConfirmation, linksPendingUpdate]
  );


  const handleUpdateSelectedPivotWord = useCallback( async (pivotWord: PivotWord | null) => {
    if (linksPendingUpdate.size > 0) {
        // show a modal in here asking if users want to continue or not
        const status = await getSaveChangesConfirmation('Changes will be lost if you navigate away. Continue?');
        // if user clicks cancel: early return, otherwise proceed
        if (status === false) {
          return;
        }
      }
      setSelectedPivotWord(pivotWord ?? undefined);
      setSaveButtonDisabled(true);
      setUpdatedSelectedRows([]);
      setLinksPendingUpdate(new Map());
      setAlignmentTableControlPanelLinkState("" as LinkStatus);
      await handleUpdateSelectedAlignedWord(null);
    },
    [handleUpdateSelectedAlignedWord, linksPendingUpdate, getSaveChangesConfirmation ]
  );


  useEffect(() => {
    if (!loading) {
      layoutCtx.setMenuBarDelegate(
        <Typography sx={{ textAlign: 'center' }}>
          Alignments :: Batch-review Mode
        </Typography>
      );
    }
  }, [layoutCtx, loading]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!pivotWords || pivotWords.length < 1) {
      return;
    }
    if (searchParams.has('pivotWord')) {
      const pivotWordId = searchParams.get('pivotWord')!;
      const pivotWord = pivotWords.find(
        (pivotWord) => pivotWord.normalizedText === pivotWordId
      );

      if (pivotWord) {
        handleUpdateSelectedPivotWord(pivotWord);
      }
      searchParams.delete('pivotWord');
    } else if (searchParams.has('alignedWord') && (selectedPivotWord)) {
      searchParams.delete('alignedWord');
    } else if (
      searchParams.has('alignmentLink') &&
      (selectedAlignedWord)
    ) {
      searchParams.delete('alignmentLink');
    }
    setSearchParams(searchParams);
  }, [
    pivotWords,
    searchParams,
    setSearchParams,
    handleUpdateSelectedPivotWord,
    selectedPivotWord,
    setSelectedAlignedWord,
    selectedAlignedWord,
    setSelectedAlignmentLink,
    selectedAlignmentLink
  ]);

  // block route changes when there are unsaved changes
  const blocker = useBlocker(
    useCallback(({currentLocation, nextLocation}: {currentLocation: Location, nextLocation: Location}) => (
      (linksPendingUpdate.size > 0) &&
      (currentLocation.pathname !== nextLocation.pathname)
      ), [linksPendingUpdate.size]
  ))

  return (
    <div style={{ position: 'relative' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gridGap: '.2em',
          gridTemplateColumns: 'repeat(18, 1fr)',
          width: '100vw !important'
        }}
      >
        {/**
         * Pivot Words
         */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'column',
            flexGrow: '0',
            flexShrink: '1',
            gridColumn: '1',
            width: '35%',
            gap: '1em',
            marginLeft: '2em',
            marginTop: '1em'
          }}
        >
          <SingleSelectButtonGroup
            value={wordSource}
            items={[
              {
                value: 'sources',
                label: 'Source'
              },
              {
                value: 'targets',
                label: 'Target'
              }
            ]}
            onSelect={(value) => setWordSource(value as AlignmentSide)}
          />
          <SingleSelectButtonGroup
            value={wordFilter}
            items={[
              {
                value: 'aligned',
                label: 'Aligned'
              },
              {
                value: 'all',
                label: 'All'
              }
            ]}
            onSelect={(value) => setWordFilter(value as PivotWordFilter)}
          />
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 10.5em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0
              }
            }}
          >
            <PivotWordTable
              loading={!pivotWords}
              sort={pivotWordSortData}
              pivotWords={pivotWords ?? []}
              chosenWord={selectedPivotWord}
              onChooseWord={(word) =>
                handleUpdateSelectedPivotWord(word)
              }
              onChangeSort={setPivotWordSortData}
            />
          </Paper>
        </Box>
        {/**
         * Aligned Words
         */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'column',
            flexShrink: '1',
            gridColumn: '1',
            width: '40%',
            gap: '1em',
            marginLeft: '2em',
            marginTop: '1em'
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0
              }
            }}
          >
            <AlignedWordTable
              sort={alignedWordSortData}
              pivotWord={selectedPivotWord}
              chosenAlignedWord={selectedAlignedWord}
              onChooseAlignedWord={(alignedWord) =>
                handleUpdateSelectedAlignedWord(alignedWord)
              }
              onChangeSort={setAlignedWordSortData}
            />
          </Paper>
        </Box>
        {/**
         * Alignment Links
         */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'column',
            flexShrink: '1',
            gridColumn: '1',
            width: '100%',
            gap: '1em',
            margin: '2em',
            marginTop: '.5em'
          }}
        >
          <AlignmentTableControlPanel
            saveButtonDisabled={saveButtonDisabled}
            setSelectedRowsCount={setSelectedRowsCount}
            selectedRowsCount={selectedRowsCount}
            linksPendingUpdate={linksPendingUpdate}
            setSaveButtonDisabled={setSaveButtonDisabled}
            container={container}
            setSelectedRows={setSelectedRows}
            selectedRows={selectedRows}
            setLinksPendingUpdate={setLinksPendingUpdate}
            updatedSelectedRows={updatedSelectedRows}
            setUpdatedSelectedRows={setUpdatedSelectedRows}
            setRowSelectionModel={setRowSelectionModel}
            alignmentTableControlPanelLinkState={alignmentTableControlPanelLinkState || null}
            setAlignmentTableControlPanelLinkState={setAlignmentTableControlPanelLinkState}
          />
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 125px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0
              }
            }}
          >
            <AlignmentTable
              wordSource={wordSource}
              pivotWord={selectedPivotWord}
              alignedWord={selectedAlignedWord ?? undefined}
              chosenAlignmentLink={selectedAlignmentLink}
              onChooseAlignmentLink={setSelectedAlignmentLink}
              updateAlignments={(resetState: boolean) => {
                dispatch(resetTextSegments());
                if (resetState) {
                  setSelectedAlignedWord(null);
                  setSelectedAlignmentLink(null);
                  setSelectedPivotWord(undefined);
                }
              }}
              setSelectedRowsCount={setSelectedRowsCount}
              setSelectedRows={setSelectedRows}
              setSaveButtonDisabled={setSaveButtonDisabled}
              setLinksPendingUpdate={setLinksPendingUpdate}
              linksPendingUpdate={linksPendingUpdate}
              container={container}
              rowSelectionModel={rowSelectionModel}
              setRowSelectionModel={setRowSelectionModel}
              alignmentTableControlPanelLinkState={alignmentTableControlPanelLinkState || null}
              setUpdatedSelectedRows={setUpdatedSelectedRows}
            />
          </Paper>
        </Box>
      </Box>
      <SaveChangesConfirmation />
      <SaveChangesConfirmationViaRouter blocker={blocker}/>
    </div>
  );
};
