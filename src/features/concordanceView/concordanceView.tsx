/**
 * This file contains the ConcordanceView component which is one of the top level
 * modes of the CA application
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlignmentSide, Link } from '../../structs';
import { Button, ButtonGroup, Divider, Paper, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, PivotWord } from './structs';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridSortItem } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';
import { usePivotWords } from './usePivotWords';
import { resetTextSegments } from '../../state/alignment.slice';
import { useAppDispatch } from '../../app/index';
import {
  CancelOutlined,
  CheckCircleOutlined,
  Close,
  FlagOutlined,
  Link as LinkIcon
} from '@mui/icons-material';
import { useSaveLink } from '../../state/links/tableManager';
import uuid from 'uuid-random';

export type PivotWordFilter = 'aligned' | 'all';


export interface AlignmentTableControlPanelProps {
  saveButtonDisabled?: boolean;
  setSaveButtonDisabled: Function;
  selectedRowsCount: number;
  linksPendingUpdate: Map<string, Link>;
}

export const AlignmentTableControlPanel = ({ saveButtonDisabled, setSaveButtonDisabled, selectedRowsCount, linksPendingUpdate }: AlignmentTableControlPanelProps) => {
  const [linkState, setLinkState] = React.useState('');
  const [arrayOfLinksToSave, setArrayOfLinksToSave] = useState<Link[]>();
  const [saveKey, setSaveKey] = useState("");
  useSaveLink(arrayOfLinksToSave, saveKey);

  const handleSaveLinkStatus = () => {
    // Take the map, transform it to an array, then pass it to the save function
    const linksToSave = [...linksPendingUpdate.values()];
    setSaveKey(uuid());
    setArrayOfLinksToSave(linksToSave);
    setSaveButtonDisabled(true);
  }

  const DisplayItemsSelectedCount = () => {
    if(selectedRowsCount === 0){
      return null
    }
    else if (selectedRowsCount === 1){
      return(
      <Typography component="span" alignSelf={'center'}>
        <Box sx={{ fontWeight: 'bold' }} display='inline'> {selectedRowsCount} item</Box> selected
      </Typography>
      )
    }
    else {
      return (
        <Typography component="span" alignSelf={'center'}>
          <Box sx={{ fontWeight: 'bold' }} display='inline'> {selectedRowsCount} items</Box> selected
        </Typography>
      )
    }
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="right"
      style={{ marginBottom: '10px' }}
    >
     <DisplayItemsSelectedCount/>
      <Divider orientation="vertical" />
      <ButtonGroup>
        <SingleSelectButtonGroup
          value={linkState}
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
          onSelect={(value) => {
            setLinkState(value);
          }}
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
        <Button variant="text">
          <Close/>
        </Button>
      </ButtonGroup>

    </Stack>
  );
};


export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  const dispatch = useAppDispatch();
  const [selectedRowsCount, setSelectedRowsCount] = React.useState(0);
  const [saveButtonDisabled, setSaveButtonDisabled] = React.useState(true);

  /**
   * pivot words
   */
  const [wordSource, setWordSource] = useState('targets' as AlignmentSide);
  const [wordFilter, setWordFilter] = useState('all' as PivotWordFilter);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem | null);
  const [linksPendingUpdate, setLinksPendingUpdate] = useState<Map<string, Link>>(new Map())
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

  const handleUpdateSelectedAlignedWord = useCallback((alignedWord: AlignedWord | null) => {
      setSelectedAlignedWord(alignedWord);
      setSelectedAlignmentLink(null);
      setSaveButtonDisabled(true);
    },
    [setSelectedAlignedWord, setSelectedAlignmentLink]
  );
  const handleUpdateSelectedPivotWord = useMemo(
    () => (pivotWord: PivotWord | null) => {
      setSelectedPivotWord(pivotWord ?? undefined);
      handleUpdateSelectedAlignedWord(null);
      setSaveButtonDisabled(true);
    },
    [setSelectedPivotWord, handleUpdateSelectedAlignedWord]
  );

  // when a pivotword is selected, indicate that it's loading or load pivotWords
  useEffect(() => {
    handleUpdateSelectedAlignedWord(null);
  }, [handleUpdateSelectedAlignedWord]);

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

  // reset links pending update if user chooses a new pivot word or aligned word
  useEffect( ()=> {
    setLinksPendingUpdate(new Map());
  }, [selectedPivotWord, selectedAlignedWord])

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
            marginTop: '1em'
          }}
        >
          <AlignmentTableControlPanel
            saveButtonDisabled={saveButtonDisabled}
            selectedRowsCount={selectedRowsCount}
            linksPendingUpdate={linksPendingUpdate}
            setSaveButtonDisabled={setSaveButtonDisabled}
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
                if(resetState) {
                  setSelectedAlignedWord(null);
                  setSelectedAlignmentLink(null);
                  setSelectedPivotWord(undefined);
                }
              }}
              setSelectedRowsCount={setSelectedRowsCount}
              setSaveButtonDisabled={setSaveButtonDisabled}
              setLinksPendingUpdate={setLinksPendingUpdate}
              linksPendingUpdate={linksPendingUpdate}
            />
          </Paper>
        </Box>
      </Box>
    </div>
  );
};
