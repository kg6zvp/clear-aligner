import './App.css';
import './styles/theme.css';
import React, { createContext } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import BCVWP from './features/bcvwp/BCVWPSupport';
import { AppState } from './state/databaseManagement';
import ProjectsView from 'features/projects';
import useInitialization from './hooks/useInitialization';

export interface AppContextProps {
  currentReference: BCVWP | null;
  setCurrentReference: (currentPosition: BCVWP | null) => void;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  preferences: Record<string, unknown>;
  setPreferences: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export const AppContext = createContext({} as AppContextProps);

const App = () => {

  const {
    currentReference,
    setCurrentReference,
    state,
    setState,
    preferences,
    setPreferences
  } = useInitialization();

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
