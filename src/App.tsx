import './App.css';
import './styles/theme.css';
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import BCVWP from './features/bcvwp/BCVWPSupport';
import PouchDB from 'pouchdb';

export interface AppContextProps {
  currentReference: BCVWP | null;
  setCurrentReference: (currentPosition: BCVWP | null) => void;
}

export const AppContext = createContext({} as AppContextProps);

const App = () => {
  const db = useMemo(() =>
    new PouchDB(''), []);

  const [currentReference, setCurrentReference] = useState(
    null as BCVWP | null
  );

  useEffect(() => {
    if (db) {
      console.log('db', db);
    }
  }, [db]);

  return (
    <AppContext.Provider
      value={{
        currentReference,
        setCurrentReference,
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
