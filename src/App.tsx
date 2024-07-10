import './App.css';
import './styles/theme.css';
import React, { createContext, useMemo, useState } from 'react';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
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
import { Containers } from './hooks/useCorpusContainers';
import { useMediaQuery } from '@mui/material';
import { CustomSnackbar } from './features/snackbar';
import { NetworkState } from '@uidotdev/usehooks';
import { setUpAmplify } from './server/amplifySetup';


export interface AppContextProps {
  projectState: ProjectState;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
  preferences: UserPreference | undefined;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreference | undefined>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  containers: Containers;
  network: NetworkState;
  userStatus: any;
  setUserStatus: Function;
  isSnackBarOpen: boolean;
  setIsSnackBarOpen: Function;
  snackBarMessage: string;
  setSnackBarMessage: Function;
  setContainers: React.Dispatch<React.SetStateAction<Containers>>;
  isProjectDialogOpen: boolean;
  setIsProjectDialogOpen: Function;
}

export type THEME = 'night' | 'day';
export type THEME_PREFERENCE = THEME | 'auto';
export const AppContext = createContext({} as AppContextProps);

setUpAmplify();

const App = () => {
  const appContext: AppContextProps = useInitialization();

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const themeDefault: THEME = useMemo(
    () => (prefersDarkMode ? 'night' : 'day'),
    [prefersDarkMode]
  );
  const [preferredTheme, setPreferredTheme] = useState(
    'auto' as THEME_PREFERENCE
  );
  const theme = useMemo(() => {
    switch (preferredTheme) {
      case 'auto':
        return themeDefault;
      default:
        return preferredTheme;
    }
  }, [themeDefault, preferredTheme]);

  const router = createHashRouter([
    {
      path: '/',
      element: <AppLayout theme={theme} />,
      children: [
        {
          index: true,
          element: <Navigate to="/projects" replace />
        },
        {
          path: '/alignment',
          element: <AlignmentEditor />
        },
        {
          path: '/concordance',
          element: <ConcordanceView />
        },
        {
          path: '/projects',
          element: <ProjectsView
            preferredTheme={preferredTheme}
            setPreferredTheme={setPreferredTheme}
          />
        }
      ]
    }
  ]);

  return (
    <>
      <AppContext.Provider value={appContext}>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
        <CustomSnackbar />
      </AppContext.Provider>
    </>
  );
};

export default App;
