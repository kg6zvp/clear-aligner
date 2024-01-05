import { useContext, useEffect, useMemo, useState } from 'react';
import { Alignment, Corpus, Link } from '../../structs';
import { Backdrop, CircularProgress, Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { AlignedWord, PivotWord } from './structs';
import { getAvailableCorpora } from '../../workbench/query';
import { SingleSelectButtonGroup } from './singleSelectButtonGroup';
import { PivotWordTable } from './pivotWordTable';
import { AlignedWordTable } from './alignedWordTable';
import { AlignmentTable } from './alignmentTable';
import { LayoutContext } from '../../AppLayout';
import { GridSortItem } from '@mui/x-data-grid';
import { useAppSelector } from '../../app';
import BCVWP, { parseFromString } from '../bcvwp/BCVWPSupport';
import findWord from '../../helpers/findWord';
import _ from 'lodash';

type WordSource = 'source' | 'target';
type WordFilter = 'aligned'|'all';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  const [loading, setLoading] = useState(true);
  const [sourceCorpus, setSourceCorpus] = useState(null as Corpus | null);
  const [targetCorpus, setTargetCorpus] = useState(null as Corpus | null);
  const [selectedPivotWord, setSelectedPivotWord] = useState(
    null as PivotWord | null
  );
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

  useEffect(() => {
    setSelectedAlignedWord(null);
  }, [selectedPivotWord, setSelectedAlignedWord]);

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
  const [wordFilter, setWordFilter] = useState('all' as WordFilter);
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

  const alignmentState = useAppSelector((state) => {
    return state.alignment.present.alignments;
  });

  useEffect(() => {
    const loadPivotWordData = async () => {
      if (!sourceCorpus || !targetCorpus) {
        setLoading(false);
        return;
      }

      const allWordsAndFrequencies = (
        wordSource === 'source' ? sourceCorpus : targetCorpus
      )?.words
        .map((word) => word.text)
        .filter((value) => !!value)
        .reduce((accumulator, currentValue) => {
          const key = currentValue.toLowerCase();
          if (!accumulator[key]) {
            accumulator[key] = 0;
          }
          ++accumulator[key];
          return accumulator;
        }, {} as { [key: string]: number });

      if (!allWordsAndFrequencies) {
        setLoading(false);
        return;
        //throw new Error('Could not load corpora, ', allWordsAndFrequencies);
      }

      const pivotWordsMap: { [text: string]: PivotWord } = Object.keys(
        allWordsAndFrequencies
      )
        .map((key) => {
          if (!allWordsAndFrequencies[key]) return null;
          return {
            pivotWord: key,
            frequency: allWordsAndFrequencies[key],
          } as PivotWord;
        })
        .filter((pivotWord): pivotWord is PivotWord => !!pivotWord)
        .reduce((accumulator, currentValue) => {
          accumulator[currentValue.pivotWord] = currentValue;
          return accumulator;
        }, {} as { [key: string]: PivotWord });

      const alignedWordsAndFrequencies = alignmentState
        ?.map((alignmentData: Alignment) => {
          if (alignmentData.source !== sourceCorpus.id) {
            throw new Error(
              `${alignmentData.source} is not equal to ${sourceCorpus.id}`
            );
          }
          if (alignmentData.target !== targetCorpus.id) {
            throw new Error(
              `${alignmentData.target} is not equal to ${targetCorpus.id}`
            );
          }
          const src = wordSource === 'source' ? sourceCorpus : targetCorpus;
          return alignmentData.links.reduce((accumulator, singleAlignment) => {
            const uniqueAlignedWords = _.uniqWith(
              singleAlignment[wordSource === 'source' ? 'sources' : 'targets']
                .map(parseFromString) // get references to all words on selected side of the alignment
                .map((wordReference: BCVWP) => findWord([src], wordReference))
                .filter((word) => !!word)
                .map((word) => word!.text.toLowerCase()),
              _.isEqual
            );

            const alignedWordsString = uniqueAlignedWords.sort().join(',');

            if (!accumulator[alignedWordsString]) {
              accumulator[alignedWordsString] = [];
            }

            accumulator[alignedWordsString].push(singleAlignment);
            return accumulator;
          }, {} as { [key: string]: Link[] });
        })
        ?.reduce((accumulator, linkMap) => {
          Object.keys(linkMap)
            .filter((key) => !!linkMap[key] && Array.isArray(linkMap[key]))
            .forEach((key) => {
              if (!accumulator[key]) {
                accumulator[key] = linkMap[key];
              } else {
                linkMap[key].forEach((link) => accumulator[key].push(link));
              }
            });
          return accumulator;
        }, {} as { [key: string]: Link[] });

      const sourceTextId = sourceCorpus.id;
      const targetTextId = targetCorpus.id;

      Object.keys(alignedWordsAndFrequencies)
        .filter((key) => !!alignedWordsAndFrequencies[key])
        .map((key: string): AlignedWord => {
          const frequency = alignedWordsAndFrequencies[key].length;

          const sourceAndTargetWords = alignedWordsAndFrequencies[key]
            .map((value: Link) => {
              const sourceWords = value.sources
                .map(parseFromString)
                .map((ref: BCVWP) => findWord([sourceCorpus], ref))
                .map((word) => word?.text)
                .filter((text) => !!text)
                .map((text) => (text as string).toLowerCase());
              const targetWords = value.targets
                .map(parseFromString)
                .map((ref: BCVWP) => findWord([targetCorpus], ref))
                .map((word) => word?.text)
                .filter((text) => !!text)
                .map((text) => (text as string).toLowerCase());
              return {
                sourceWords,
                targetWords,
              } as {
                sourceWords: string[];
                targetWords: string[];
              };
            })
            .reduce(
              (accumulator, currentValue) => {
                currentValue.sourceWords.forEach((current) =>
                  accumulator.sourceWords.push(current)
                );
                currentValue.targetWords.forEach((current) =>
                  accumulator.targetWords.push(current)
                );
                return accumulator;
              },
              { sourceWords: [], targetWords: [] }
            );

          return {
            id: key,
            frequency,
            sourceTextId,
            targetTextId,
            sourceWordTexts: _.uniqWith(
              sourceAndTargetWords.sourceWords,
              _.isEqual
            ),
            targetWordTexts: _.uniqWith(
              sourceAndTargetWords.targetWords,
              _.isEqual
            ),
            alignments: alignedWordsAndFrequencies[key],
          };
        })
        .forEach((alignedWord: AlignedWord) => {
          (wordSource === 'source'
            ? alignedWord.sourceWordTexts
            : alignedWord.targetWordTexts
          ).forEach((wordText: string) => {
            if (!pivotWordsMap[wordText]) {
              return;
            }
            if (!pivotWordsMap[wordText].alignedWords) {
              pivotWordsMap[wordText].alignedWords = [];
            }
            pivotWordsMap[wordText].alignedWords!.push(alignedWord);
          });
        });

      setSrcPivotWords(Object.values(pivotWordsMap));
      setLoading(false);
    };

    if (!alignmentState || alignmentState.length < 1) {
      setLoading(false);
      return;
    }
    if (sourceCorpus && targetCorpus && wordSource) {
      setLoading(true);
      void loadPivotWordData();
    }
  }, [
    alignmentState,
    wordSource,
    sourceCorpus,
    targetCorpus,
    setLoading,
    setSrcPivotWords,
  ]);

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
          <SingleSelectButtonGroup
            value={wordFilter}
            items={[
              {
                value: 'aligned',
                label: 'Aligned Words',
              },
              {
                value: 'all',
                label: 'All words',
              },
            ]}
            onSelect={(value) => setWordFilter(value as WordFilter)}
          />
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 14em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <PivotWordTable
              loading={pivotWordsLoading}
              sort={pivotWordSortData}
              pivotWords={wordFilter === 'all' ? pivotWords : pivotWords.filter(w => w.alignedWords)}
              onChooseWord={(word) =>
                setSelectedPivotWord(
                  word.alignedWords && word.alignedWords.length > 0
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
            margin: '2em',
            marginTop: '1em',
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              width: '100%',
              height: 'calc(100vh - 64px - 7.5em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <AlignedWordTable
              sort={alignedWordSortData}
              alignedWords={selectedPivotWord?.alignedWords ?? []}
              onChooseAlignedWord={(alignedWord) =>
                setSelectedAlignedWord(
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
              height: 'calc(100vh - 64px - 7.5em)',
              '.MuiTableContainer-root::-webkit-scrollbar': {
                width: 0,
              },
            }}
          >
            <AlignmentTable
              sort={alignmentSortData}
              alignments={selectedAlignedWord?.alignments ?? []}
              onChangeSort={setAlignmentSortData}
            />
          </Paper>
        </Box>
      </Box>
    </div>
  );
};
