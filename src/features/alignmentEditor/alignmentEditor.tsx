import React, { useContext, useEffect, useState } from 'react';
import BCVWP, { parseFromString } from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { Corpus, Word } from '../../structs';
import {
  getAvailableCorpora,
  getAvailableCorporaIds,
  queryText,
} from '../../workbench/query';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';

const getRefParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
};

const getRefFromURL = (): BCVWP | null => {
  const refParam = getRefParam();

  if (refParam) {
    return parseFromString(refParam);
  }
  return null;
};

const defaultDocumentTitle = '🌲⬇️';

export const AlignmentEditor = () => {
  const layoutCtx = useContext(LayoutContext);
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorpora, setSelectedCorpora] = useState([] as Corpus[]);

  const [currentPosition, setCurrentPosition] = useState(getRefFromURL());

  React.useEffect(() => {
    if (currentPosition) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle} ${
          currentPosition?.getBookInfo()?.EnglishBookName
        } ${currentPosition?.chapter}:${currentPosition?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [currentPosition, layoutCtx]);

  React.useEffect(() => {
    const loadSourceWords = async () => {
      const corpora = await getAvailableCorpora();
      const corpus = corpora.find((v: Corpus) => v.id === 'sbl-gnt');
      const currentPosition = new BCVWP(45, 5, 3);

      const retrievedCorpora: Corpus[] = [];

      for (const corpusId of corpora.map((c) => c.id)) {
        const corpus = await queryText(corpusId, currentPosition);
        if (corpus) retrievedCorpora.push(corpus!);
      }

      setSelectedCorpora(retrievedCorpora);
      setAvailableWords(corpus?.words ?? []);
      setCurrentPosition(currentPosition);
    };

    loadSourceWords().catch(console.error);
  }, [setAvailableWords, setCurrentPosition, setSelectedCorpora]);

  React.useEffect(() => {
    if (!currentPosition) {
      return;
    }
    const loadCorporaAtPosition = async () => {
      const corpusIds = await getAvailableCorporaIds();

      const retrievedCorpora: Corpus[] = [];
      for (const corpusId of corpusIds) {
        const corpus = await queryText(corpusId, currentPosition);
        if (corpus) retrievedCorpora.push(corpus);
      }
      setSelectedCorpora(retrievedCorpora);
    };

    void loadCorporaAtPosition();
  }, [currentPosition, setSelectedCorpora]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={currentPosition} />
    );
  }, [layoutCtx, currentPosition]);

  return (
    <>
      <div style={{ display: 'grid', justifyContent: 'center' }}>
        <br />
        <BCVNavigation
          horizontal
          disabled={!availableWords || availableWords.length < 1}
          words={availableWords}
          currentPosition={currentPosition ?? undefined}
          onNavigate={setCurrentPosition}
        />
      </div>
      <Workbench corpora={selectedCorpora} currentPosition={currentPosition} />
    </>
  );
};
