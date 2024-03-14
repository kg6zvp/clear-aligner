import React, { useContext, useEffect, useState } from 'react';
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
  // const setDefaultBcv = React.useCallback(async () => {
  //   if (!appCtx.preferences?.currentProject) return;
  //   const hasBcv = appCtx?.preferences?.bcv?.toReferenceString?.() && await appCtx.projectState?.projectTable?.hasBcvInSource?.(
  //     appCtx.preferences.currentProject,
  //     appCtx.preferences.bcv?.toReferenceString?.() ?? ''
  //   );
  //
  //   if (!hasBcv && hasBcv !== undefined) {
  //     const defaultBcv = await appCtx.projectState?.userPreferenceTable?.getFirstBcvFromSource?.(appCtx?.preferences?.currentProject);
  //     appCtx.setPreferences((p: UserPreference | undefined) => ({
  //       ...(p ?? {}) as UserPreference,
  //       bcv: defaultBcv?.id
  //         ? BCVWP.parseFromString(defaultBcv.id)
  //         : new BCVWP(1, 1, 1)
  //     })); // set current reference to default
  //   }
  // }, [appCtx, appCtx?.preferences?.bcv, appCtx.projectState?.projectTable, appCtx.projectState?.userPreferenceTable]);

  // set current reference to default if none set
  // useEffect(() => {
  //   setDefaultBcv().catch(console.error);
  // }, [appCtx.preferences?.currentProject]);
  useEffect(() => {
    if (currentPosition
      || _.isEqual(currentPosition, appCtx.preferences?.bcv)) {
      return;
    }
    appCtx.setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentBCV: currentPosition
    }));
  }, [appCtx, currentPosition]);

  React.useEffect(() => {
    if (appCtx.preferences?.bcv) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          appCtx.preferences?.bcv?.getBookInfo()?.EnglishBookName
        } ${appCtx.preferences?.bcv?.chapter}:${appCtx.preferences?.bcv?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [appCtx.preferences?.bcv, layoutCtx]);

  const { sourceContainer, targetContainer } = useCorpusContainers();

  React.useEffect(() => {
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
