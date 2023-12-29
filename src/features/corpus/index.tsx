import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Add, InfoOutlined, Remove, Settings } from '@mui/icons-material';
import useDebug from 'hooks/useDebug';
import TextSegment from 'features/textSegment';
import CorpusSettings from 'features/corpusSettings';
import { Corpus, Verse, Word } from 'structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';

export interface CorpusProps {
  corpus: Corpus;
  viewportIndex: number;
  corpora: Corpus[];
}

const determineCorpusView = (
  corpus: Corpus,
  verses: Verse[],
  bcvId: BCVWP | null
) =>
  verses.map((verse) => {
    return (
      <Grid container key={`${corpus.id}/${verse.bcvId}`}>
        <Grid item xs={1} sx={{ p: '1px' }}>
          <Typography
            sx={
              bcvId?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
                ? { textDecoration: 'underline', fontStyle: 'italic' }
                : {}
            }
          >
            {verse.citation}
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
            {(verse.words || []).map(
              (word: Word): ReactElement => (
                <TextSegment
                  corpus={corpus}
                  key={`${corpus.id}/${word.id}`}
                  word={word}
                />
              )
            )}
          </Typography>
        </Grid>
      </Grid>
    );
  });

export const CorpusComponent = (props: CorpusProps): ReactElement => {
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const { corpus, viewportIndex, corpora } = props;
  useDebug('TextComponent');

  const initialVerses = useMemo(() => {
    if (!corpus.primaryVerse) return [];
    return [
      corpus.wordsByVerse[
        corpus.primaryVerse!.toTruncatedReferenceString(BCVWPField.Verse)
      ],
    ].filter((v) => v);
  }, [corpus]);

  const [visibleVerses, setVisibleVerses] = useState<Verse[]>(initialVerses);
  const [showSettings, setShowSettings] = useState(false);
  const verseKeys = useMemo(
    () => Object.keys(corpus.wordsByVerse),
    [corpus.wordsByVerse]
  );

  useEffect(() => {
    setVisibleVerses(initialVerses);
  }, [corpus.primaryVerse, initialVerses]);

  const addBcvId = useCallback(() => {
    const updatedVerses = [
      corpus.wordsByVerse[
        verseKeys[
          verseKeys.indexOf(visibleVerses[0].bcvId.toReferenceString()) - 1
        ]
      ],
      ...visibleVerses,
      corpus.wordsByVerse[
        verseKeys[
          verseKeys.indexOf(
            visibleVerses[visibleVerses.length - 1].bcvId.toReferenceString()
          ) + 1
        ]
      ],
    ].filter((v) => v) as Verse[];
    setVisibleVerses(updatedVerses);
  }, [visibleVerses, corpus.wordsByVerse, verseKeys]);

  const removeBcvId = useCallback(() => {
    setVisibleVerses((verses) =>
      verses.slice(
        corpus.primaryVerse?.matchesTruncated(
          verses[0]?.bcvId,
          BCVWPField.Verse
        )
          ? 0
          : 1,
        verses.length === 1 ||
          corpus.primaryVerse?.matchesTruncated(
            verses[verses.length - 1]?.bcvId,
            BCVWPField.Verse
          )
          ? verses.length
          : -1
      )
    );
  }, [corpus.primaryVerse]);

  const corpusActionEnableState = useMemo(() => {
    const firstBcvId =
      corpus.wordsByVerse[
        verseKeys[
          verseKeys.indexOf(visibleVerses[0].bcvId.toReferenceString()) - 1
        ]
      ]?.bcvId;
    const lastBcvId =
      corpus.wordsByVerse[
        verseKeys[
          verseKeys.indexOf(
            visibleVerses[visibleVerses.length - 1].bcvId.toReferenceString()
          ) + 1
        ]
      ]?.bcvId;
    const showAdd = !firstBcvId && !lastBcvId ? 'add' : null;
    return visibleVerses.length <= 1 ? 'remove' : showAdd;
  }, [corpus.wordsByVerse, visibleVerses, verseKeys]);

  if (!corpus) {
    return <Typography>Empty State</Typography>;
  }

  return (
    <Grid
      container
      flexDirection="column"
      justifyContent="space-between"
      sx={{ height: '100%', flex: 1 }}
    >
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ py: 1, px: 2 }}
      >
        <Grid container sx={{ flex: 1 }}>
          {!showSettings && (
            <CorpusAction
              add={addBcvId}
              remove={removeBcvId}
              disabled={corpusActionEnableState}
            />
          )}
        </Grid>
        <Grid
          container
          justifyContent="flex-end"
          alignItems="center"
          sx={{ flex: 1 }}
        >
          <Typography variant="h6" sx={{ mr: 1 }}>
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
            <InfoOutlined />
          </Tooltip>
          <IconButton
            onClick={() => {
              setShowSettings(!showSettings);
            }}
          >
            <Settings />
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
        <Grid
          ref={textContainerRef}
          container
          sx={{ pl: 4, flex: 8, overflow: 'auto' }}
        >
          {determineCorpusView(corpus, visibleVerses, corpus.primaryVerse)}
        </Grid>
      )}
    </Grid>
  );
};

interface CorpusActionProps {
  add: () => void;
  remove: () => void;
  disabled?: 'add' | 'remove' | null;
}

const CorpusAction: React.FC<CorpusActionProps> = ({
  add,
  remove,
  disabled,
}) => {
  return (
    <Grid container>
      <Tooltip title="Show the next verses">
        <span>
          <IconButton onClick={add} disabled={disabled === 'add'}>
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Remove the outer verses">
        <span>
          <IconButton onClick={remove} disabled={disabled === 'remove'}>
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Grid>
  );
};

export default CorpusComponent;
