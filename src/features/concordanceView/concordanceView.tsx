import { useContext, useEffect, useMemo, useState } from 'react';
import { AlignmentSide, DisplayableLink, Link } from '../../structs';
import { Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, PivotWord } from './structs';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridSortItem } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';
import _ from 'lodash';
import { usePivotWords } from './usePivotWords';

export type WordFilter = 'aligned' | 'all';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);

  /**
   * pivot words
   */
  const [wordSource, setWordSource] = useState('targets' as AlignmentSide);
  const [wordFilter, setWordFilter] = useState('all' as WordFilter);
  const srcPivotWords = usePivotWords(wordSource);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'instances.length',
    sort: 'desc',
  } as GridSortItem | null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loading = useMemo(() => !!srcPivotWords, [ srcPivotWords, srcPivotWords?.length ]);

  const pivotWords: PivotWord[]|undefined = useMemo(() => {
    if (!srcPivotWords) {
      return undefined;
    }
    if (!pivotWordSortData) {
      return [...srcPivotWords];
    }
    return [...srcPivotWords].sort((a, b) => {
      const aValue = _.get(a as any, pivotWordSortData.field);
      const bValue = _.get(b as any, pivotWordSortData.field);
      return pivotWordSortData.sort === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    srcPivotWords,
    srcPivotWords?.length,
    pivotWordSortData,
  ]);

  const [selectedPivotWord, setSelectedPivotWord] = useState<
    PivotWord | undefined
  >();
  const [alignedWordSortData, setAlignedWordSortData] = useState({
    field: 'frequency',
    sort: 'desc',
  } as GridSortItem | null);
  const [selectedAlignedWord, setSelectedAlignedWord] = useState(
    null as AlignedWord | null
  );
  const [alignmentSortData, setAlignmentSortData] = useState({
    field: 'id',
    sort: 'desc',
  } as GridSortItem | null);
  const [selectedAlignmentLink, setSelectedAlignmentLink] = useState(
    null as Link | null
  );

  const handleUpdateSelectedAlignedWord = useMemo(
    () => (alignedWord: AlignedWord | null) => {
      setSelectedAlignedWord(alignedWord);
      setSelectedAlignmentLink(null);
    },
    [setSelectedAlignedWord, setSelectedAlignmentLink]
  );
  const handleUpdateSelectedPivotWord = useMemo(
    () => (pivotWord: PivotWord | null) => {
      setSelectedPivotWord(pivotWord ?? undefined);
      handleUpdateSelectedAlignedWord(null);
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
        <Typography sx={{ textAlign: 'center', translate: '-20px' }}>
          Alignments :: Batch-review Mode
        </Typography>
      );
    }
  }, [layoutCtx, loading]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (loading || !srcPivotWords || srcPivotWords.length < 1) {
      return;
    }
    if (searchParams.has('pivotWord')) {
      const pivotWordId = searchParams.get('pivotWord')!;
      const pivotWord = srcPivotWords.find(
        (pivotWord) => pivotWord.normalizedText === pivotWordId
      );

      if (pivotWord) {
        handleUpdateSelectedPivotWord(pivotWord);
      }

      if (searchParams.has('alignedWord') && (pivotWord || selectedPivotWord)) {
        const alignedWordId = searchParams.get('alignedWord')!;
        const alignedWord = (pivotWord ??
          selectedPivotWord)!.alignedWords?.find(
          (alignedWord) => alignedWord.id === alignedWordId
        );

        if (alignedWord) {
          setSelectedAlignedWord(alignedWord);
        }
        if (
          searchParams.has('alignmentLink') &&
          (alignedWord || selectedAlignedWord)
        ) {
          const alignmentLinkId = searchParams.get('alignmentLink');
          const alignmentLink = (
            alignedWord ?? selectedAlignedWord
          )?.alignments?.find((link) => link.id === alignmentLinkId);

          if (alignmentLink) {
            setSelectedAlignmentLink(alignmentLink);
          }
          searchParams.delete('alignmentLink');
        }
        searchParams.delete('alignedWord');
      }
      searchParams.delete('pivotWord');
    }
    setSearchParams(searchParams);
  }, [
    loading,
    srcPivotWords,
    searchParams,
    setSearchParams,
    handleUpdateSelectedPivotWord,
    selectedPivotWord,
    setSelectedAlignedWord,
    selectedAlignedWord,
    setSelectedAlignmentLink,
    selectedAlignmentLink,
  ]);

  return (
    <div style={{ position: 'relative' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gridGap: '.5em',
          gridTemplateColumns: 'repeat(18, 1fr)',
          width: '100vw !important',
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
            width: '100%',
            gap: '1em',
            marginLeft: '2em',
            marginTop: '1em',
          }}
        >
          <SingleSelectButtonGroup
            value={wordSource}
            items={[
              {
                value: 'sources',
                label: 'Source',
              },
              {
                value: 'targets',
                label: 'Target',
              },
            ]}
            onSelect={(value) => setWordSource(value as AlignmentSide)}
          />
          <SingleSelectButtonGroup
            value={wordFilter}
            items={[
              {
                value: 'aligned',
                label: 'Aligned',
              },
              {
                value: 'all',
                label: 'All',
              },
            ]}
            onSelect={(value) => setWordFilter(value as WordFilter)}
          />
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 10.5em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <PivotWordTable
              loading={!pivotWords}
              sort={pivotWordSortData}
              pivotWords={
                (wordFilter === 'all'
                  ? pivotWords
                  : pivotWords?.filter((w) => w.hasAlignmentLinks)
                ) ?? []
              }
              chosenWord={selectedPivotWord}
              onChooseWord={(word) =>
                handleUpdateSelectedPivotWord(
                  (word.alignedWords && word.alignedWords.length > 0) ||
                    word.hasAlignmentLinks
                    ? word
                    : null
                )
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
            width: '100%',
            gap: '1em',
            marginLeft: '2em',
            marginTop: '1em',
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <AlignedWordTable
              sort={alignedWordSortData}
              pivotWord={selectedPivotWord}
              chosenAlignedWord={selectedAlignedWord}
              onChooseAlignedWord={(alignedWord) =>
                handleUpdateSelectedAlignedWord(
                  alignedWord.alignments && alignedWord.alignments.length > 0
                    ? alignedWord
                    : null
                )
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
            marginTop: '1em',
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 4em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <AlignmentTable
              sort={alignmentSortData}
              wordSource={wordSource}
              pivotWord={selectedPivotWord}
              alignedWord={selectedAlignedWord}
              alignments={selectedAlignedWord?.alignments ?? []}
              onChangeSort={setAlignmentSortData}
              chosenAlignmentLink={selectedAlignmentLink}
              onChooseAlignmentLink={(alignmentLink: DisplayableLink) =>
                setSelectedAlignmentLink(alignmentLink)
              }
            />
          </Paper>
        </Box>
      </Box>
    </div>
  );
};
