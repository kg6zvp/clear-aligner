import { useContext, useEffect, useMemo, useState } from 'react';
import { Corpus } from '../../structs';
import { Backdrop, CircularProgress, Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { PivotWord } from './structs';
import { getAvailableCorpora } from '../../workbench/query';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { LayoutContext } from '../../AppLayout';
import { GridSortItem } from '@mui/x-data-grid';

type WordSource = 'source' | 'target';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  const [loading, setLoading] = useState(true);
  const [sourceCorpus, setSourceCorpus] = useState(null as Corpus | null);
  const [targetCorpus, setTargetCorpus] = useState(null as Corpus | null);

  useEffect(() => {
    if (!loading) {
      layoutCtx.setMenuBarDelegate(
        <Typography sx={{ textAlign: 'center', translate: '-20px' }}>
          Alignments :: Batch-review Mode
        </Typography>
      );
    }
  }, [layoutCtx, loading]);

  /**
   * pivot words
   */
  const [pivotWordsPromise, setPivotWordsPromise] = useState(
    null as Promise<PivotWord[]> | null
  );
  const [wordSource, setWordSource] = useState('target' as WordSource);
  const [srcPivotWords, setSrcPivotWords] = useState([] as PivotWord[]);
  const [pivotWords, setPivotWords] = useState([] as PivotWord[]);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc',
  } as GridSortItem | null);

  const pivotWordsLoading = useMemo(() => {
    return !!pivotWordsPromise;
  }, [pivotWordsPromise]);

  useEffect(() => {
    if (!!pivotWordsPromise) {
      pivotWordsPromise.then((pivotWords) => {
        setPivotWords(pivotWords);
        setPivotWordsPromise(null);
      });
    }
  }, [pivotWordsPromise, setPivotWords, setPivotWordsPromise]);

  useEffect(() => {
    const loadCorpora = async () => {
      const corpora: Corpus[] = await getAvailableCorpora();

      corpora.forEach((corpus) => {
        if (corpus.id === 'sbl-gnt') {
          setSourceCorpus(corpus);
        } else if (corpus.id === 'na27-YLT') {
          setTargetCorpus(corpus);
        }
      });
    };

    void loadCorpora();
  }, [setSourceCorpus, setTargetCorpus]);

  useEffect(() => {
    const loadCorpus = async (src: Corpus) => {
      const wordsAndFrequencies = src?.words
        .map((word) => word.text)
        .reduce((accumulator, currentValue) => {
          if (!accumulator[currentValue]) {
            accumulator[currentValue] = 0;
          }
          ++accumulator[currentValue];
          return accumulator;
        }, {} as { [key: string]: number });

      if (!wordsAndFrequencies)
        throw new Error('Could not load corpora, ', wordsAndFrequencies);

      const pivotWords: PivotWord[] = Object.keys(wordsAndFrequencies)
        .map((key) => {
          if (!wordsAndFrequencies[key]) return null;
          return {
            pivotWord: key,
            frequency: wordsAndFrequencies[key],
          } as PivotWord;
        })
        .filter((pivotWord): pivotWord is PivotWord => !!pivotWord);

      setSrcPivotWords(pivotWords);

      setLoading(false);
    };

    setLoading(true);
    switch (wordSource) {
      case 'source':
        if (sourceCorpus) {
          void loadCorpus(sourceCorpus);
        }
        break;
      case 'target':
        if (targetCorpus) {
          void loadCorpus(targetCorpus);
        }
        break;
    }
  }, [sourceCorpus, targetCorpus, wordSource, setSrcPivotWords, setLoading]);

  useEffect(() => {
    const performSort = async (srcPivotWords: PivotWord[]) => {
      if (!pivotWordSortData) {
        return [...srcPivotWords];
      }
      return [...srcPivotWords].sort((a, b) => {
        const aValue = (a as any)[pivotWordSortData.field];
        const bValue = (b as any)[pivotWordSortData.field];
        return pivotWordSortData.sort === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });
    };

    if (srcPivotWords.length < 1) {
      // don't sort on nothing
      return;
    }
    setPivotWordsPromise(performSort(srcPivotWords));
  }, [srcPivotWords, pivotWordSortData, setPivotWordsPromise]);

  return (
    <div style={{ position: 'relative' }}>
      <Backdrop
        open={loading}
        sx={{
          position: 'absolute',
          marginTop: '-1em',
          marginBottom: '-1em',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <CircularProgress color={'inherit'} />
      </Backdrop>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          marginTop: '1em',
        }}
      >
        <table
          style={{
            alignSelf: 'center',
            minWidth: '15%',
          }}
        >
          <tbody>
            <tr>
              <td>Source:</td>
              <td>
                <Typography sx={{ textAlign: 'right' }}>
                  {sourceCorpus?.name}
                </Typography>
              </td>
            </tr>
            <tr>
              <td>Target:</td>
              <td>
                <Typography sx={{ textAlign: 'right' }}>
                  {targetCorpus?.name}
                </Typography>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Box
        sx={{
          flex: 1,
          display: 'grid',
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
            gridColumn: '1/span 4',
            width: '100%',
            gap: '1em',
            margin: '2em',
            marginTop: '1em',
          }}
        >
          <SingleSelectButtonGroup
            value={wordSource}
            items={[
              {
                value: 'source',
                label: 'Source',
              },
              {
                value: 'target',
                label: 'Target',
              },
            ]}
            onSelect={(value) => setWordSource(value as WordSource)}
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
              loading={pivotWordsLoading}
              sort={pivotWordSortData}
              pivotWords={pivotWords}
              onChooseWord={(word) => console.log(word)}
              onChangeSort={setPivotWordSortData}
            />
          </Paper>
        </Box>
      </Box>
    </div>
  );
};
