import './App.css';
import './styles/theme.css';
import React from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';

const App = () => (
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
);

export default App;
