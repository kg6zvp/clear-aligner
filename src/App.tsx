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
import { ProjectState } from './state/databaseManagement';
import { useLinksTable } from './state/links/useLinksTable';
import { VirtualTableLinks } from './state/links/tableManager';

export interface AppContextProps {
  currentReference: BCVWP | null;
  setCurrentReference: (currentPosition: BCVWP | null) => void;
  projectState: ProjectState;
  setProjectState: (state: ProjectState) => void;
  replaceLinksTable: (linksTableFactory: () => Promise<VirtualTableLinks>) => Promise<void>
}

export const AppContext = createContext({} as AppContextProps);

const App = () => {
  const [currentReference, setCurrentReference] = useState(
    null as BCVWP | null
  );
  const [state, setState] = useState({} as ProjectState);

  const linksTable = useLinksTable();

  const replaceLinksTable = useMemo(() => (async (linksTableFactory: () => Promise<VirtualTableLinks>): Promise<void> => {
    if (state.linksTable) {
      try {
        await state.linksTable.close();
      } catch (e) {
        console.error('error closing linksTable!', e);
      }
    }
    const linksTable = await linksTableFactory();
    setState({
      ...state,
      linksTable
    });
  }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, state.linksTable, setState]);

  useEffect(() => {
    if (linksTable && !state.linksTable) {
      setState({
        ...state,
        linksTable,
      });
    }
  }, [linksTable, state, setState]);

  return (
    <AppContext.Provider
      value={{
        currentReference,
        setCurrentReference,
        projectState: state,
        setProjectState: setState,
        replaceLinksTable,
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
