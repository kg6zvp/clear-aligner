import React, { useContext, useEffect, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { AlignmentSide, CorpusContainer, Word } from '../../structs';
import { getAvailableCorporaContainers } from '../../workbench/query';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';
import { UserPreference } from 'state/preferences/tableManager';
import { DefaultProjectName } from '../../state/links/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';

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

  const updatePreferences = React.useCallback((pref: Partial<UserPreference>) => {
    appCtx.setPreferences((p: UserPreference | undefined) => {
      const updatedPreferences = { ...((p ?? {}) as UserPreference), ...pref };
      appCtx.projectState.userPreferenceTable?.saveOrUpdate?.(updatedPreferences);
      return updatedPreferences;
    });
  }, [appCtx]);

  const setDefaultBcv = React.useCallback(async () => {
    if(!appCtx.preferences?.currentProject) return;
    const hasBcv = appCtx?.preferences?.bcv?.toReferenceString?.() && await appCtx.projectState?.projectTable?.hasBcvInSource?.(
      appCtx.preferences.currentProject,
      appCtx.preferences.bcv?.toReferenceString?.() ?? ""
    );

    if (!hasBcv && hasBcv !== undefined) {
      const defaultBcv = await appCtx.projectState?.userPreferenceTable?.getFirstBcvFromSource?.(appCtx?.preferences?.currentProject);
      appCtx.setPreferences((p: UserPreference | undefined) => ({
        ...(p ?? {}) as UserPreference,
        bcv: defaultBcv?.id
            ? BCVWP.parseFromString(defaultBcv.id)
            : new BCVWP(45, 5, 3)
      })); // set current reference to default
    }
  }, [appCtx, appCtx.preferences, appCtx.setPreferences, updatePreferences]);

  // set current reference to default if none set
  useEffect(() => {
    setDefaultBcv().catch(console.error);
  }, [appCtx.preferences?.currentProject]);

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
      setSelectedCorporaContainers([ sourceContainer, targetContainer ]);
      setAvailableWords(
        targetContainer?.corpora.flatMap(({ words }) => words) ?? []
      );
    };

    if(appCtx.projectState.linksTable?.getSourceName?.()) {
      loadSourceWords().catch(console.error);
    }
  }, [
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
              currentPosition={appCtx.preferences?.bcv ?? undefined}
              onNavigate={bcv => appCtx.setPreferences((p: UserPreference | undefined) => ({
                ...(p ?? {}) as UserPreference,
                bcv
              }))}
            />
          </div>
        )
      }
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={appCtx.preferences?.bcv}
      />
    </>
  );
};
