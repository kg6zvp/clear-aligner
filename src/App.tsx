import './App.css';
import './styles/theme.css';
import React, { createContext, useEffect, useState } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import BCVWP from './features/bcvwp/BCVWPSupport';
import { Link } from './structs';
import { ProjectState } from './state/databaseManagement';

export interface AppContextProps {
  currentReference: BCVWP | null;
  setCurrentReference: (currentPosition: BCVWP | null) => void;
  state: ProjectState;
  setState: (state: ProjectState) => void;
}

export const AppContext = createContext({} as AppContextProps);

const App = () => {
  const [currentReference, setCurrentReference] = useState(
    null as BCVWP | null
  );
  const [state, setState] = useState({} as ProjectState);

  //debug
  useEffect(() => {
    if (!state.linksTable) {
      return;
    }
   console.log('entries');
    state.linksTable.allDocs({ include_docs: true })
      .then((docs) => docs.rows
        .map(({ doc }) => doc as unknown as Link)
        .forEach((link) => {
          console.log('link', link);
        }))
  }, [state.linksTable]);

  return (
    <AppContext.Provider
      value={{
        currentReference,
        setCurrentReference,
        state,
        setState,
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
