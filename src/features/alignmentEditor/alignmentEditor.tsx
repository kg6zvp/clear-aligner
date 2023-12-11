import Workbench from '../../workbench';
import React, { useContext, useEffect, useState } from 'react';
import { Corpus, SyntaxRoot, SyntaxType, Word } from '../../structs';
import BCVWP, { parseFromString } from '../bcvwp/BCVWPSupport';
import fetchSyntaxData from '../../workbench/fetchSyntaxData';
import {
  getAvailableCorpora,
  getAvailableCorporaIds,
  queryText,
} from '../../workbench/query';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import BCVNavigation from '../../BCVNavigation/BCVNavigation';
import { LayoutContext } from '../../AppLayout';

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
    const loadSyntaxData = async () => {
      try {
        const loadedSyntaxData = await fetchSyntaxData(currentPosition);

        const corporaIds = await getAvailableCorporaIds();
        const retrievedCorpora: Corpus[] = [];

        for (const corpusId of corporaIds) {
          const corpus = await queryText(corpusId, currentPosition);
          if (corpus) retrievedCorpora.push(corpus!);
        }

        // set the syntax
        retrievedCorpora.forEach((corpus) => {
          corpus.syntax = {
            ...(loadedSyntaxData as SyntaxRoot),
            _syntaxType: SyntaxType.Source,
          };
        });

        setSelectedCorpora(retrievedCorpora);
      } catch (error) {
        console.error(error);
      }
    };

    loadSyntaxData().catch(console.error);
  }, [currentPosition, currentPosition?.book, setSelectedCorpora]);

  React.useEffect(() => {
    const loadSourceWords = async () => {
      const corpus = (await getAvailableCorpora())[0];
      setAvailableWords(corpus?.words ?? []);
      setCurrentPosition(new BCVWP(45, 5, 3));
    };

    loadSourceWords().catch(console.error);
  }, [setAvailableWords, setCurrentPosition]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={currentPosition} />
    );
  }, [layoutCtx, currentPosition]);

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <br />
        <BCVNavigation
          horizontal
          disabled={!availableWords || availableWords.length < 1}
          words={availableWords}
          currentPosition={currentPosition ?? undefined}
          onNavigate={(selection) => {
            setCurrentPosition(selection);
          }}
        />
      </div>
      <Workbench corpora={selectedCorpora} currentPosition={currentPosition} />
    </>
  );
};
