import React, { useContext, useEffect, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import {CorpusContainer, Word} from '../../structs';
import {
  getAvailableCorporaContainers,
  getAvailableCorporaIds,
  queryText,
} from '../../workbench/query';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { useSearchParams } from 'react-router-dom';

const getRefParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
};

const getRefFromURL = (): BCVWP | null => {
  const refParam = getRefParam();

  if (refParam) {
    return BCVWP.parseFromString(refParam);
  }
  return null;
};

const defaultDocumentTitle = 'ClearAligner';

export const AlignmentEditor = () => {
  const layoutCtx = useContext(LayoutContext);
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState([] as CorpusContainer[]);

  const [currentPosition, setCurrentPosition] = useState(
    getRefFromURL() ?? (new BCVWP(45, 5, 3) as BCVWP | null)
  );

  React.useEffect(() => {
    if (currentPosition) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          currentPosition?.getBookInfo()?.EnglishBookName
        } ${currentPosition?.chapter}:${currentPosition?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [currentPosition, layoutCtx]);

  React.useEffect(() => {
    const loadSourceWords = async () => {
      const containers = await getAvailableCorporaContainers();
      const targetCorpora = containers.find((v: CorpusContainer) => v.id === 'target');

      setSelectedCorporaContainers(containers);
      setAvailableWords(targetCorpora?.corpora.flatMap(({ words }) => words) ?? []);
    };

    loadSourceWords().catch(console.error);
  }, [
    setAvailableWords,
    setCurrentPosition,
    setSelectedCorporaContainers,
  ]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={currentPosition} />
    );
  }, [layoutCtx, currentPosition]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.has('ref')) {
      const newPosition = BCVWP.parseFromString(searchParams.get('ref')!);
      setCurrentPosition(newPosition);
      searchParams.delete('ref');
    }
    setSearchParams(searchParams);
  }, [searchParams, setCurrentPosition, setSearchParams]);

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
      <Workbench corpora={selectedCorporaContainers} currentPosition={currentPosition} />
    </>
  );
};
