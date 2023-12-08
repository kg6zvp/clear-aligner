import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Corpus} from "../structs";
import {CircularProgress, Paper, Typography} from "@mui/material";
import { Box } from '@mui/system';
import {PivotWord} from "./Structs";
import {getAvailableCorpora} from "../workbench/query";
import {SingleSelectButtonGroup} from "./SingleSelectButtonGroup";
import {PivotWordTable} from "./PivotWordTable";
import {LayoutContext} from "../AppLayout";
import {GridSortItem} from "@mui/x-data-grid";

type WordSource = 'source'|'target';
type WordFilter = 'content'|'all';

export const ConcordanceView = () => {
  const layoutCtx = useContext(LayoutContext);
  layoutCtx.setMenuBarDelegate(<Typography sx={{textAlign: 'center', translate: '-20px'}}>Alignments :: Batch-review Mode</Typography>);
  const [loading, setLoading] = useState(true);
  const [sourceCorpus, setSourceCorpus] = useState(null as Corpus|null);
  const [targetCorpus, setTargetCorpus] = useState(null as Corpus|null);

  /**
   * pivot words
   */
  const [pivotWordsPromise, setPivotWordsPromise] = useState(null as Promise<PivotWord[]>|null);
  const pivotWordsPromiseHandler = useRef((pivotWords: PivotWord[]) => {
    setPivotWords([]);
    setPivotWords(pivotWords);
    setPivotWordsPromise(null);
  });
  const [wordSource, setWordSource] = useState('target' as WordSource);
  const [contentFilter, setContentFilter] = useState('all' as WordFilter);
  const [srcPivotWords, setSrcPivotWords] = useState([] as PivotWord[]);
  const [pivotWords, setPivotWords] = useState([] as PivotWord[]);
  const [pivotWordSortData, setPivotWordSortData] = useState({
    field: 'frequency',
    sort: 'desc'
  } as GridSortItem|null);

  const pivotWordsLoading = useMemo(() => {
    return !!pivotWordsPromise;
  }, [pivotWordsPromise]);

  useEffect(() => {
    if (!!pivotWordsPromise) {
      pivotWordsPromise.then(pivotWordsPromiseHandler.current);
    }
  }, [pivotWordsPromise, pivotWordsPromiseHandler]);

  useEffect(() => {
    pivotWordsPromiseHandler.current = (pivotWords: PivotWord[]) => {
      setPivotWords([]);
      setPivotWords(pivotWords);
      setPivotWordsPromise(null);
    };
  }, [setPivotWords, setPivotWordsPromise]);

  useEffect(() => {
    const loadCorpora = async () => {
      const corpora : Corpus[] = await getAvailableCorpora();

      corpora.forEach(corpus => {
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
      if (!pivotWordSortData) {
        return [ ...srcPivotWords ];
      }
      return [ ...srcPivotWords ].sort((a, b) => {
        const aValue = (a as any)[pivotWordSortData.field];
        const bValue = (b as any)[pivotWordSortData.field];
        return pivotWordSortData.sort === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    setPivotWordsPromise(performSort());
  }, [srcPivotWords, pivotWordSortData, setPivotWordsPromise]);

  if (loading) {
    return <Box sx={{ display: 'flex', margin: 'auto' }}>
      <CircularProgress sx={{ transform: 'translateY(-50%)', margin: 'auto', marginTop: '50vh' }}/>
    </Box>
  }

  return <div>
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      marginTop: '1em'
    }}>
      <table style={{
        alignSelf: 'center',
        minWidth: '15%'
      }}>
        <tbody>
        <tr>
          <td>Source:</td>
          <td><Typography sx={{ textAlign: 'right' }}>{sourceCorpus?.name}</Typography></td>
        </tr>
        <tr>
          <td>Target:</td>
          <td><Typography sx={{ textAlign: 'right' }}>{targetCorpus?.name}</Typography></td>
        </tr>
        </tbody>
      </table>
    </div>
    <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
        }}>
      {/**
       * Pivot Words
       */}
      <Box sx={{
        display: 'flex',
        flexFlow: 'column',
        gap: '1em',
        margin: '2em',
        marginTop: '1em'
      }} >
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
        <Paper sx={{
          display: 'flex',
          width: '100%',
          height: 'calc(100vh - 64px - 14.5em)'
        }}>
          <PivotWordTable sort={pivotWordSortData} pivotWords={pivotWords} onChooseWord={(word) => console.log(word)} onChangeSort={setPivotWordSortData} />
        </Paper>
      </Box>
    </Box>
  </div>
}
