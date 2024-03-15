import React, { useContext, useEffect, useRef, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { CorpusContainer, Word } from '../../structs';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';
import { UserPreference } from 'state/preferences/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import _ from 'lodash';

const defaultDocumentTitle = 'ClearAligner';

interface AlignmentEditorProps {
  showNavigation?: boolean;
}

export const AlignmentEditor: React.FC<AlignmentEditorProps> = ({ showNavigation = true }) => {
  const layoutCtx = useContext(LayoutContext);
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState(
    [] as CorpusContainer[]
  );
  const appCtx = useContext(AppContext);
  const [currentPosition, setCurrentPosition] =
    useState<BCVWP | undefined>(appCtx.preferences?.bcv ?? new BCVWP(1, 1, 1));
  const savedPosition = useRef<BCVWP | undefined>();

  useEffect(() => {
    if (!currentPosition
      || _.isEqual(currentPosition, savedPosition.current)) {
      return;
    }
    savedPosition.current = currentPosition;
    appCtx.setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentBCV: currentPosition
    }));
  }, [appCtx, currentPosition, savedPosition]);

  useEffect(() => {
    if (currentPosition) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          currentPosition.getBookInfo()?.EnglishBookName
        } ${currentPosition?.chapter}:${currentPosition?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [currentPosition, layoutCtx]);

  const { sourceContainer, targetContainer } = useCorpusContainers();

  useEffect(() => {
    if (!sourceContainer || !targetContainer) return;
    const loadSourceWords = async () => {
      setSelectedCorporaContainers([sourceContainer, targetContainer]);
      setAvailableWords(
        targetContainer?.corpora.flatMap(({ words }) => words) ?? []
      );
    };
    if (appCtx.projectState.linksTable?.getSourceName?.()) {
      loadSourceWords().catch(console.error);
    }
  }, [
    appCtx.projectState?.linksTable,
    sourceContainer,
    targetContainer,
    setAvailableWords,
    setSelectedCorporaContainers,
    appCtx.projects
  ]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={appCtx.preferences?.bcv} />
    );
  }, [layoutCtx, appCtx.preferences?.bcv]);

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
              currentPosition={currentPosition}
              onNavigate={bcv => {
                if (!_.isEqual(bcv, currentPosition)) {
                  setCurrentPosition(bcv);
                }
              }}
            />
          </div>
        )
      }
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={currentPosition}
      />
    </>
  );
};
