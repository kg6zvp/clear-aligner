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
    if (!appCtx.preferences?.bcv && appCtx.preferences?.currentProject) {
      const defaultBcv = await appCtx.projectState?.userPreferenceTable?.getFirstBcvFromSource?.(appCtx?.preferences?.currentProject);
      const hasBcv = appCtx?.preferences?.bcv?.toReferenceString?.() && await appCtx.projectState?.projectTable?.hasBcvInSource?.(
        appCtx.preferences.currentProject,
        appCtx.preferences.bcv?.toReferenceString?.() ?? ""
      );
      appCtx.setPreferences((p: UserPreference | undefined) => ({
        ...(p ?? {}) as UserPreference,
        bcv: hasBcv && p?.bcv ? p.bcv : (defaultBcv?.id
            ? BCVWP.parseFromString(defaultBcv.id)
            : new BCVWP(45, 5, 3))
      })); // set current reference to default
    }
  }, [appCtx, appCtx.preferences, appCtx.setPreferences, updatePreferences]);

  // set current reference to default if none set
  useEffect(() => {
    setDefaultBcv().catch(console.error);
  }, [setDefaultBcv]);

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

  React.useEffect(() => {
    const loadSourceWords = async () => {
      const containers = await getAvailableCorporaContainers(appCtx);
      const targetCorpora = containers.find(
        (v: CorpusContainer) => v.id === AlignmentSide.TARGET
      );

      setSelectedCorporaContainers(containers);
      setAvailableWords(
        targetCorpora?.corpora.flatMap(({ words }) => words) ?? []
      );
    };

    if(appCtx.projectState.linksTable?.getSourceName?.()) {
      loadSourceWords().catch(console.error);
    }
  }, [
    appCtx,
    setAvailableWords,
    setSelectedCorporaContainers
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
