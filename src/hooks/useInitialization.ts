import React, { useState } from 'react';
import { AppState } from '../state/databaseManagement';
import { getAvailableCorporaContainers } from '../workbench/query';
import { ProjectTable } from '../state/projects/tableManager';
import { UserPreferenceTable } from '../state/preferences/tableManager';
import BCVWP from '../features/bcvwp/BCVWPSupport';

const useInitialization = () => {
  const [currentReference, setCurrentReference] = useState(
    null as BCVWP | null
  );
  const [state, setState] = useState<AppState>({
    projects: new ProjectTable(),
    userPreferences: new UserPreferenceTable(),
  } as AppState);
  const [preferences, setPreferences] = useState<Record<string, unknown>>(
    Object.fromEntries(state.userPreferences.getPreferences().entries())
  );
  const initializeAppState = async (): Promise<AppState> => {
    const corpusContainers = await getAvailableCorporaContainers();
    const projects = new ProjectTable(corpusContainers.find(c => c.id === "target"));

    return {
      projects: projects,
      currentProject: projects.getProjects().values().next().value,
      userPreferences: new UserPreferenceTable(),
      sourceCorpora: corpusContainers.find(c => c.id === "source")
    } as AppState;
  }

  React.useEffect(() => {
    initializeAppState().then(setState);
  }, []);

  return {
    state,
    setState,
    preferences,
    setPreferences,
    currentReference,
    setCurrentReference
  }
}

export default useInitialization;
