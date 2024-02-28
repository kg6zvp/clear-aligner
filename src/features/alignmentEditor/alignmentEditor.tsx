import React, { useContext, useEffect, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { CorpusContainer, Word } from '../../structs';
import { getAvailableCorporaContainers } from '../../workbench/query';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';

const defaultDocumentTitle = 'ClearAligner';

interface AlignmentEditorProps {
  showNavigation?: boolean;
}

export const AlignmentEditor: React.FC<AlignmentEditorProps> = ({showNavigation = true}) => {
  const layoutCtx = useContext(LayoutContext);
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState(
    [] as CorpusContainer[]
  );

  const appCtx = useContext(AppContext);

  // set current reference to default if none set
  useEffect(() => {
    if (!appCtx.currentReference) {
      appCtx.setCurrentReference(new BCVWP(45, 5, 3)); // set current reference to default
    }
  }, [appCtx, appCtx.currentReference, appCtx.setCurrentReference]);

  React.useEffect(() => {
    if (appCtx.currentReference) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          appCtx.currentReference?.getBookInfo()?.EnglishBookName
        } ${appCtx.currentReference?.chapter}:${appCtx.currentReference?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [appCtx.currentReference, layoutCtx]);

  React.useEffect(() => {
    const loadSourceWords = async () => {
      const containers = await getAvailableCorporaContainers();
      const targetCorpora = containers.find(
        (v: CorpusContainer) => v.id === 'target'
      );

      setSelectedCorporaContainers(containers);
      setAvailableWords(
        targetCorpora?.corpora.flatMap(({ words }) => words) ?? []
      );
    };

    loadSourceWords().catch(console.error);
  }, [
    setAvailableWords,
    appCtx.setCurrentReference,
    setSelectedCorporaContainers,
  ]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={appCtx.currentReference} />
    );
  }, [layoutCtx, appCtx.currentReference]);

  return (
    <>
      {
        showNavigation && (
          <div style={{ display: 'grid', justifyContent: 'center' }}>
            <br />
            <BCVNavigation
              horizontal
              disabled={!availableWords || availableWords.length < 1}
              words={availableWords}
              currentPosition={appCtx.currentReference ?? undefined}
              onNavigate={appCtx.setCurrentReference}
            />
          </div>
        )
      }
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={appCtx.currentReference}
      />
    </>
  );
};
