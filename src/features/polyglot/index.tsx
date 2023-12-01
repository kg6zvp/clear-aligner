import React, {useMemo, useRef} from 'react';
import {Card, CircularProgress, Stack, Grid, Typography} from '@mui/material';

import { useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import CorpusComponent from 'features/corpus';
import {Corpus, CorpusViewport} from 'structs';

import './styles.css';

interface PolyglotProps {
  corpora: Corpus[];
}

export const Polyglot: React.FC<PolyglotProps> = ({ corpora}) => {
  useDebug('PolyglotComponent');
  const corpusViewportRefs = useRef<HTMLDivElement[]>([]);

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  const corpusViewports = useAppSelector((state) => {
    return state.app.corpusViewports;
  });

  const corporaWithoutViewport = useMemo(() => {
    return corpora.filter((corpus) => (
      !corpusViewports.map(viewport => viewport.corpusId).includes(corpus.id)
    ));
  }, [corpora, corpusViewports]);

  return (
    <Stack
      direction="row"
      spacing={2}
      style={{ height: '16rem' }}
      justifyContent="stretch"
      alignItems="stretch"
    >
      {corpusViewports.length === 0 && (
          corporaWithoutViewport.length
            ? (
                <Typography variant="h6" style={{ margin: 'auto' }}>
                    To begin, add a corpus viewport.
                </Typography>
            )
            : (
                  <Grid container flexDirection="column" alignItems="center">
                      <Typography variant="h6" style={{ margin: 'auto' }}>
                          Loading corpora.
                      </Typography>
                      <CircularProgress variant="indeterminate" />
                  </Grid>
            )
      )}

      {corpora.length &&
        corpusViewports.map(
          (corpusViewport: CorpusViewport, index: number) => {
            const corpusId = corpusViewport.corpusId;
            const key = `text_${index}`;
            const corpus = corpora.find(c => c.id === corpusViewport.corpusId);
            if(!corpus) return <Grid />;
            return (
              <Card
                onScroll={(e) => {
                  if (scrollLock) {
                    const newScrollTop = (e.target as HTMLDivElement).scrollTop;
                    corpusViewportRefs.current.forEach((ref) => {
                      ref.scrollTop = newScrollTop;
                    });
                  }
                }}
                ref={(el) => {
                  if (el) {
                    corpusViewportRefs.current[index] = el;
                  }
                }}
                elevation={2}
                className="corpus-container corpus-scroll-container"
                key={key}
                style={{
                  flexGrow: '1',
                  flexBasis: '0',
                  minWidth: '16rem',
                  position: 'relative'
                }}
              >
                <CorpusComponent
                  key={corpusId}
                  corpus={corpus}
                  viewportIndex={index}
                  corpora={corpora}
                />
              </Card>
            );
          }
        )}
    </Stack>
  );
};

export default Polyglot;
