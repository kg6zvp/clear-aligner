import './App.css';
import './styles/theme.css';
import React, { createContext, useState } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import BCVWP from './features/bcvwp/BCVWPSupport';
import { AppState } from './state/databaseManagement';
import { UserPreferenceTable } from './state/preferences/tableManager';
import ProjectsView from 'features/projects';
import { ProjectTable } from './state/projects/tableManager';
import { getAvailableCorporaContainers } from './workbench/query';

export interface AppContextProps {
  currentReference: BCVWP | null;
  setCurrentReference: (currentPosition: BCVWP | null) => void;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  preferences: Record<string, unknown>;
  setPreferences: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export const AppContext = createContext({} as AppContextProps);

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

const App = () => {
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

  React.useEffect(() => {
    initializeAppState().then(setState);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentReference,
        setCurrentReference,
        appState: state,
        setAppState: setState,
        preferences,
        setPreferences
      }}
    >
      <Provider store={store}>
        <HashRouter>
          <Routes>
            <Route path={'/'} element={<AppLayout />}>
              <Route index element={<AlignmentEditor />} />
              <Route path={'/concordance'} element={<ConcordanceView />} />
              <Route path={'/projects'} element={<ProjectsView />} />
            </Route>
          </Routes>
        </HashRouter>
      </Provider>
    </AppContext.Provider>
  );
};

export default App;
