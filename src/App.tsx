import './App.css';
import './styles/theme.css';
import React, { createContext, useMemo, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AlignmentEditor } from './features/alignmentEditor/alignmentEditor';
import { ConcordanceView } from './features/concordanceView/concordanceView';
import { store } from 'app/store';
import { Provider } from 'react-redux';
import { ProjectState } from './state/databaseManagement';
import { UserPreference } from './state/preferences/tableManager';
import ProjectsView from 'features/projects';
import { Project } from './state/projects/tableManager';
import useInitialization from './utils/useInitialization';
import { DatabaseStatus } from './state/links/tableManager';
import { Box, CircularProgress, Dialog, DialogContent, DialogContentText, Typography } from '@mui/material';
import { getCorporaInitializationState, InitializationStates } from './workbench/query';
import { useInterval } from 'usehooks-ts';
import _ from 'lodash';

export interface AppContextProps {
  projectState: ProjectState;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
  preferences: UserPreference | undefined;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreference | undefined>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export const AppContext = createContext({} as AppContextProps);
const BusyRefreshTimeInMs = 500;

const App = () => {
  const appContext: AppContextProps = useInitialization();
  const [initializationState, setInitializationState] = useState<InitializationStates>();
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>();
  useInterval(() => {
    const newDatabaseStatus = appContext.projectState?.linksTable.getDatabaseStatus();
    if (!_.isEqual(newDatabaseStatus, databaseStatus)) {
      setDatabaseStatus(newDatabaseStatus);
    }
    const newInitializationState = getCorporaInitializationState();
    if (newInitializationState !== initializationState) {
      setInitializationState(newInitializationState);
    }
  }, BusyRefreshTimeInMs);
  const spinnerParams = useMemo<{
    isBusy?: boolean,
    text?: string,
    variant?: 'determinate' | 'indeterminate',
    value?: number
  }>(() => {
    const busyInfo = databaseStatus?.busyInfo;
    if (busyInfo?.isBusy) {
      const progressCtr = busyInfo?.progressCtr ?? 0;
      const progressMax = busyInfo?.progressMax ?? 0;
      if (progressMax > 0
        && progressMax >= progressCtr) {
        const percentProgress = Math.round((progressCtr / progressMax) * 100.0);
        return {
          isBusy: true,
          text: busyInfo?.userText ?? 'The database is busy...',
          variant: percentProgress < 100 ? 'determinate' : 'indeterminate',
          value: percentProgress < 100 ? percentProgress : undefined
        };
      } else {
        return {
          isBusy: true,
          text: busyInfo?.userText ?? 'The database is busy...',
          variant: 'indeterminate',
          value: undefined
        };
      }
    }
    if (initializationState === InitializationStates.INITIALIZING) {
      return {
        isBusy: true,
        text: 'Loading corpora...',
        variant: 'indeterminate',
        value: undefined
      };
    }
    return {
      isBusy: false,
      text: undefined,
      variant: 'indeterminate',
      value: undefined
    };
  }, [databaseStatus?.busyInfo, initializationState]);

  return (
    <>
      <Dialog
        open={!!spinnerParams.isBusy}>
        <DialogContent>
          <Box sx={{
            display: 'flex',
            margin: 'auto',
            position: 'relative'
          }}>
            <CircularProgress sx={{ margin: 'auto' }}
                              variant={spinnerParams.variant ?? 'indeterminate'}
                              value={spinnerParams.value} />
            {!!spinnerParams.value && <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
              <Typography variant="caption">{`${spinnerParams.value}%`}</Typography>
            </Box>}
          </Box>
          <DialogContentText>
            {spinnerParams.text}
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <AppContext.Provider value={appContext}>
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
    </>
  );
};

export default App;
