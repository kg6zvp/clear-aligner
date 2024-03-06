import './App.css';
import './styles/theme.css';
import React, { createContext, useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import BCVWP from './features/bcvwp/BCVWPSupport';
import { ProjectState } from './state/databaseManagement';
import { useCheckDatabase } from './state/links/tableManager';
import { UserPreferenceTable } from './state/preferences/tableManager';

export interface AppContextProps {
  currentReference: BCVWP | null;
  setCurrentReference: (currentPosition: BCVWP | null) => void;
  projectState: ProjectState;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
  preferences: Record<string, unknown>;
  setPreferences: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

export const AppContext = createContext({} as AppContextProps);

const App = () => {
  const [currentReference, setCurrentReference] = useState(
    null as BCVWP | null
  );
  const [state, setState] = useState({} as ProjectState);
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const { result: linksTable } = useCheckDatabase('App');

  useEffect(() => {
    const currLinksTable = state.linksTable ?? linksTable;
    const currPreferenceTable = state.userPreferences ?? new UserPreferenceTable();
    if (!state.linksTable || !state.userPreferences) {
      setState({
        ...state,
        linksTable: currLinksTable,
        userPreferences: currPreferenceTable
      });
    }
    setPreferences(p => Object.keys(p).length ? p : Object.fromEntries(currPreferenceTable.getPreferences().entries()));
  }, [linksTable, state, state.linksTable, setState]);

  return (
    <AppContext.Provider
      value={{
        currentReference,
        setCurrentReference,
        projectState: state,
        setProjectState: setState,
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
            </Route>
          </Routes>
        </HashRouter>
      </Provider>
    </AppContext.Provider>
  );
};

export default App;
