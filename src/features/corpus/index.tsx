import React, {ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Grid, IconButton, Tooltip, Typography} from '@mui/material';
import {ArrowDropDown, ArrowDropUp, InfoOutlined, Settings} from '@mui/icons-material';

import useDebug from 'hooks/useDebug';
import TextSegment from 'features/textSegment';
import CorpusSettings from 'features/corpusSettings';

import {Corpus, CorpusViewType, TreedownType, Verse, Word} from 'structs';
import Treedown from "../treedown";

interface CorpusProps {
  corpus: Corpus;
  viewportIndex: number;
  corpora: Corpus[];
}

const determineCorpusView = (corpus: Corpus, verses: Verse[], bcvId: string) => {
  switch (corpus.viewType) {
    case CorpusViewType.Treedown: {
      const syntaxCorpora = ['sbl', 'nestle1904'];
      const treedownType = syntaxCorpora.includes(corpus.id)
        ? TreedownType.Source
        : TreedownType.Mapped;
      return <Treedown corpus={corpus} treedownType={treedownType}/>
    }
    default: {
      return verses.map(verse => (
        <Grid container key={verse.bcvId}>
          <Grid item xs={1} sx={{p: '1px'}}>
            <Typography sx={bcvId === verse.bcvId ? {textDecoration: 'underline', fontStyle: 'italic'} : {}}>
              {verse.citation}.
            </Typography>
          </Grid>
          <Grid item xs={11}>
            <Typography
              style={{
                paddingBottom: '0.5rem',
                paddingLeft: '0.7rem',
                paddingRight: '0.7rem',
              }}
            >
              {(verse.words || []).map((word: Word): ReactElement => {
                return <TextSegment key={word.id} word={word}/>;
              })}
            </Typography>
          </Grid>
        </Grid>
      ))
    }
  }
};

export const CorpusComponent = (props: CorpusProps): ReactElement => {
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const {corpus, viewportIndex, corpora} = props;
  useDebug('TextComponent');

  const initialVerses = useMemo(() => [corpus.wordsByVerse[corpus.primaryVerse]].filter(v => v), [corpus]);

  const [visibleVerses, setVisibleVerses] = useState<Verse[]>(initialVerses);
  const [showSettings, setShowSettings] = useState(false);
  const verseKeys = useMemo(() => Object.keys(corpus.wordsByVerse), [corpus.wordsByVerse]);

  useEffect(() => {
    setVisibleVerses(initialVerses);
  }, [corpus.primaryVerse]);

  const addBcvId = useCallback((start: boolean) => {
    const updatedVerses = [
      ...(start ? [corpus.wordsByVerse[verseKeys[verseKeys.indexOf(visibleVerses[0].bcvId) - 1]]] : []),
      ...visibleVerses,
      ...(start ? [] : [corpus.wordsByVerse[verseKeys[verseKeys.indexOf(visibleVerses[visibleVerses.length - 1].bcvId) + 1]]])
    ].filter(v => v) as Verse[];
    setVisibleVerses(updatedVerses);
    if (textContainerRef.current) {
      (textContainerRef.current as HTMLDivElement).scrollTop = start ? 0 : (textContainerRef.current?.scrollHeight || 0);
    }
  }, [visibleVerses, corpus.wordsByVerse, verseKeys]);

  const removeBcvId = useCallback((start: boolean) => {
    setVisibleVerses(verses => verses.slice(start ? 0 : 1, start ? -1 : verses.length));
    if (textContainerRef.current) {
      (textContainerRef.current as HTMLDivElement).scrollTop = start ? 0 : (textContainerRef.current?.scrollHeight || 0);
    }
  }, []);

  const upArrowEnableState = useMemo(() => {
    const firstBcvId = corpus.wordsByVerse[verseKeys[verseKeys.indexOf(visibleVerses[0].bcvId) - 1]]?.bcvId;
    const showUp = !firstBcvId ? "up" : null
    return visibleVerses[0]?.bcvId === corpus.primaryVerse ? "down" : showUp;
  }, [corpus.wordsByVerse, visibleVerses, corpus.primaryVerse, verseKeys]);

  const downArrowEnableState = useMemo(() => {
    const lastBcvId = corpus.wordsByVerse[verseKeys[verseKeys.indexOf(visibleVerses[visibleVerses.length - 1].bcvId) + 1]]?.bcvId;
    const showDown = !lastBcvId ? "down" : null
    return visibleVerses[visibleVerses.length - 1]?.bcvId === corpus.primaryVerse ? "up" : showDown;
  }, [corpus.wordsByVerse, visibleVerses, corpus.primaryVerse, verseKeys]);

  if (!corpus) {
    return <Typography>Empty State</Typography>;
  }

  return (
    <Grid container flexDirection="column" justifyContent="space-between" sx={{height: '100%', flex: 1}}>
      <Grid container justifyContent="space-between" alignItems="center" sx={{py: 1, px: 2}}>
        <Grid container sx={{flex: 1}}>
          {
            !showSettings && (
              <ArrowButton isStart add={addBcvId} remove={removeBcvId} disabled={upArrowEnableState} />
            )
          }
        </Grid>
        <Grid container justifyContent="flex-end" alignItems="center" sx={{flex: 1}}>
          <Typography variant="h6" sx={{mr: 1}}>
            {corpus.name}
          </Typography>

          <Tooltip
            title={
              <>
                <Typography variant="h6">{corpus.fullName}</Typography>
                <Typography>{corpus.name}</Typography>
                <Typography>Language: {corpus.language}</Typography>
              </>
            }
          >
            <InfoOutlined/>
          </Tooltip>
          <IconButton
            onClick={() => {
              setShowSettings(!showSettings);
            }}
          >
            <Settings/>
          </IconButton>
        </Grid>
      </Grid>

      {showSettings && (
        <CorpusSettings
          currentCorpusId={corpus.id}
          viewportIndex={viewportIndex}
          corpora={corpora}
        />
      )}
      {!showSettings && (
        <Grid ref={textContainerRef} container sx={{pl: 4, flex: 8, overflow: 'auto'}}>
          {determineCorpusView(corpus, visibleVerses, corpus.primaryVerse)}
        </Grid>
      )}
      {!showSettings && (
        <Grid sx={{py: 1, px: 2, flex: 1}}>
          <ArrowButton add={addBcvId} remove={removeBcvId} disabled={downArrowEnableState}/>
        </Grid>
      )}
    </Grid>
  );
};


interface ArrowButtonProps {
  add: (start: boolean) => void;
  remove: (start: boolean) => void;
  isStart?: boolean;
  disabled?: "up" | "down" | null
}

const ArrowButton: React.FC<ArrowButtonProps> = ({add, remove, disabled, isStart = false}) => {

  return (
    <Grid container>
      <IconButton onClick={() => isStart ? add(true) : remove(true)} disabled={disabled === "up"}>
        <ArrowDropUp/>
      </IconButton>
      <IconButton onClick={() => isStart ? remove(false) : add(false)} disabled={disabled === "down"}>
        <ArrowDropDown/>
      </IconButton>
    </Grid>
  );
}

export default CorpusComponent;
