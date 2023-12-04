import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Corpus} from "../structs";
import {CircularProgress, Grid, Paper} from "@mui/material";
import { Box } from '@mui/system';
import {PivotWord, SortData} from "./Structs";
import {getAvailableCorpora} from "../workbench/query";
import {SingleSelectButtonGroup} from "./SingleSelectButtonGroup";
import {PivotWordTable} from "./PivotWordTable";
import {LayoutContext} from "../AppLayout";

type WordSource = 'source'|'target';
type WordFilter = 'content'|'all';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  layoutCtx.setMenuBarDelegate('Concordance View');
  const [loading, setLoading] = useState(true);
  const [sourceCorpus, setSourceCorpus] = useState(null as Corpus|null);
  const [targetCorpus, setTargetCorpus] = useState(null as Corpus|null);

  /**
   * pivot words
   */
  const [pivotWordsPromise, setPivotWordsPromise] = useState(null as Promise<PivotWord[]>|null);
  const pivotWordsPromiseHandler = useRef((pivotWords: PivotWord[]) => {
    setPivotWords(pivotWords);
    setPivotWordsPromise(null);
  });
  const [wordSource, setWordSource] = useState('target' as WordSource);
  const [contentFilter, setContentFilter] = useState('all' as WordFilter);
  const [srcPivotWords, setSrcPivotWords] = useState([] as PivotWord[]);
  const [pivotWords, setPivotWords] = useState([] as PivotWord[]);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    direction: 'desc'
  } as SortData);

  const pivotWordsLoading = useMemo(() => {
    console.log('pivotWordsLoading', !!pivotWordsPromise);
    return !!pivotWordsPromise;
  }, [pivotWordsPromise]);

  useEffect(() => {
    if (!!pivotWordsPromise) {
      pivotWordsPromise.then(pivotWordsPromiseHandler.current);
    }
  }, [pivotWordsPromise, pivotWordsPromiseHandler]);

  useEffect(() => {
    pivotWordsPromiseHandler.current = (pivotWords: PivotWord[]) => {
      setPivotWords(pivotWords);
      setPivotWordsPromise(null);
    };
  }, [setPivotWords, setPivotWordsPromise]);

  useEffect(() => {
    const loadCorpora = async () => {
      const corpora : Corpus[] = await getAvailableCorpora();

      corpora.forEach(corpus => {
        console.log('corpus.id', corpus.id);
        console.log('corpus.name', corpus.name);
        if (corpus.id === 'sbl-gnt') {
          setSourceCorpus(corpus);
        } else if (corpus.id === 'na27-YLT') {
          setTargetCorpus(corpus);
        }
      });
    }

    void loadCorpora();
  }, [setSourceCorpus, setTargetCorpus]);

  useEffect(() => {
    const loadCorpus = async (src: Corpus) => {
      const wordsAndFrequencies = src?.words
        .map(word =>  word.text)
        .reduce((accumulator, currentValue) => {
          if (!accumulator[currentValue]) {
            accumulator[currentValue] = 0;
          }
          ++accumulator[currentValue];
          return accumulator;
        }, {} as { [key: string]: number });

      if (!wordsAndFrequencies) throw new Error("Could not load corpora, ", wordsAndFrequencies);

      const pivotWords = Object.keys(wordsAndFrequencies).map(key => ({
        pivotWord: key,
        frequency: wordsAndFrequencies[key]
      } as PivotWord));

      setSrcPivotWords(pivotWords);

      setLoading(false);
    }

    setLoading(true);
    switch (wordSource) {
      case "source":
        if (sourceCorpus) {
          loadCorpus(sourceCorpus).then(() => console.log('finished loading pivot words for source'));
        }
        break;
      case "target":
        if (targetCorpus) {
          loadCorpus(targetCorpus).then(() => console.log('finished loading pivot words for target'));
        }
        break;
    }
  }, [sourceCorpus, targetCorpus, wordSource, setSrcPivotWords, setLoading]);

  useEffect(() => {
    const performSort = async () => {
      console.log('performSort()');
      return [ ...srcPivotWords ].sort((a, b) => {
        const aValue = (a as any)[pivotWordSortData.field];
        const bValue = (b as any)[pivotWordSortData.field];
        return pivotWordSortData.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    console.log('trigger sort...');
    setPivotWordsPromise(performSort());
  }, [srcPivotWords, pivotWordSortData, setPivotWordsPromise]);

  if (loading) {
    return <Box sx={{ display: 'flex', margin: 'auto' }}>
      <CircularProgress sx={{ transform: 'translateY(-50%)', margin: 'auto', marginTop: '50vh' }}/>
    </Box>
  }

  return <Box sx={{ display: 'flex', margin: 'auto' }}>
    {/**
      * Pivot Words
      */}
    <Box width={'auto'} margin={'4em'} marginBottom={'auto'} maxHeight={'80vh !important'}>
      <Grid item margin={'.5em'}>
        <SingleSelectButtonGroup
          value={wordSource}
          items={[
            {
              value: 'source',
              label: "Source"
            },
            {
              value: 'target',
              label: "Target"
            }]}
          onSelect={(value) => setWordSource(value as WordSource)} />
      </Grid>
      <Grid item margin={'.5em'}>
        <SingleSelectButtonGroup
          value={contentFilter}
          items={[
            {
              value: 'content',
              label: 'Content'
            },
            {
              value: 'all',
              label: 'All'
            }
          ]}
          onSelect={(value) => setContentFilter(value as WordFilter)} />
      </Grid>
      <Grid item margin={'.5em'} flexDirection={'column'} flexGrow={'1'} >
        <Paper sx={{
          width: '100%',
          height: '100%',
        }}>
          <PivotWordTable { ...pivotWordsLoading ? { loading: true } : {} } sort={pivotWordSortData} pivotWords={pivotWords} onChooseWord={(word) => console.log(word)} onChangeSort={setPivotWordSortData} />
        </Paper>
      </Grid>
    </Box>
  </Box>
}
