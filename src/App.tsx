import './App.css';
import './styles/theme.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={'/'} element={<AppLayout />}>
            <Route index element={<AlignmentEditor />} />
            <Route path={'/concordance'} element={<ConcordanceView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
