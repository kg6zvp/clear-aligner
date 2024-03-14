import {
  AppBar,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  useMediaQuery,
  Typography,
  Grid, DialogContent, Box, CircularProgress, DialogContentText, Dialog
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import React, { createContext, useContext, useMemo, useState } from 'react';
import Themed from './features/themed';
import {
  createSearchParams,
  Outlet,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { AddLink, ManageSearch, LibraryBooks } from '@mui/icons-material';
import useTrackLocation from './utils/useTrackLocation';
import { AppContext } from './App';
import { getCorporaInitializationState, InitializationStates } from './workbench/query';
import { useInterval } from 'usehooks-ts';
import _ from 'lodash';
import { DatabaseStatus } from './state/databaseManagement';

type THEME = 'night' | 'day';
type THEME_PREFERENCE = THEME | 'auto';

export interface LayoutContextProps {
  windowTitle: string;
  setWindowTitle: (title: string) => void;
  setMenuBarDelegate: React.Dispatch<
    React.SetStateAction<JSX.Element | string | null>
  >;
}

export const LayoutContext = createContext({} as LayoutContextProps);

// Needed for the Busybox/Dialog to work properly down below
const BusyRefreshTimeInMs = 500;


export const AppLayout = () => {
  useTrackLocation();
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

  const [showMenu, setShowMenu] = useState(false);
  const [menuBarDelegate, setMenuBarDelegate] = useState(
    null as JSX.Element | string | null
  );
  const layoutContext: LayoutContextProps = useMemo(
    () => ({
      windowTitle: document.title,
      setWindowTitle: (title) => (document.title = title),
      setMenuBarDelegate,
    }),
    [setMenuBarDelegate]
  );

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const {preferences, projects, projectState} = useContext(AppContext);
  const projectName = useMemo(() => (
    (projects || []).find(p => p.id === preferences?.currentProject)?.name ?? projects?.[0]?.name ?? ""
  ), [projects, preferences]);

  // code needed for the Dialog/BusyBox to work properly down below
  const [initializationState, setInitializationState] = useState<InitializationStates>();
  const [databaseStatus, setDatabaseStatus] = useState<{
    projects: DatabaseStatus,
    links: DatabaseStatus
  }>();
  useInterval(() => {
    const linkStatus = projectState?.linksTable.getDatabaseStatus();
    const projectStatus = projectState?.projectTable.getDatabaseStatus();
    if (!_.isEqual({projects: projectStatus, links: linkStatus}, databaseStatus)) {
      setDatabaseStatus({
        projects: projectStatus,
        links: linkStatus
      });
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
    const busyKey = Object.keys(databaseStatus ?? {}).find(key =>
      databaseStatus?.[key as keyof typeof databaseStatus]?.busyInfo?.isBusy)
    const busyInfo = databaseStatus?.[(busyKey ?? "") as keyof typeof databaseStatus]?.busyInfo;
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
  }, [databaseStatus?.projects?.busyInfo, databaseStatus?.links?.busyInfo, initializationState]);


  return (
    <LayoutContext.Provider value={layoutContext}>
      <Themed theme={theme}>
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

        <AppBar position={'fixed'} enableColorOnDark={theme !== 'night'}>
          <Grid container justifyContent="space-between" alignItems="center" sx={{position: 'relative'}}>
          <Toolbar aria-label={'Menu'} onClick={() => setShowMenu(!showMenu)}>
            <IconButton>
              <MenuIcon {...(theme !== 'night' && { htmlColor: 'white' })} />
            </IconButton>
            <div style={{ width: '100%' }} onClick={() => setShowMenu(true)}>
              {menuBarDelegate ?? <></>}
            </div>
          </Toolbar>
            <Typography variant="h6" sx={{fontWeight: 'bold', position: 'absolute', top: "50%", left: '50%', transform: 'translate(-50%, -50%)'}}>
              {projectName}
            </Typography>
          </Grid>
          <Drawer
            anchor={'left'}
            open={showMenu}
            onClose={() => setShowMenu(false)}
          >
            <nav>
              <List>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setShowMenu(false);
                      navigate({
                        pathname: '/',
                        search: createSearchParams(searchParams).toString(),
                      });
                    }}
                  >
                    <ListItemIcon>
                      <AddLink />
                    </ListItemIcon>
                    <ListItemText primary={'Alignment Editor'} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setShowMenu(false);
                      navigate({
                        pathname: '/concordance',
                        search: createSearchParams(searchParams).toString(),
                      });
                    }}
                  >
                    <ListItemIcon>
                      <ManageSearch />
                    </ListItemIcon>
                    <ListItemText primary={'Concordance View'} />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setShowMenu(false);
                      navigate({
                        pathname: '/projects',
                      });
                    }}
                  >
                    <ListItemIcon>
                      <LibraryBooks />
                    </ListItemIcon>
                    <ListItemText primary='Projects' />
                  </ListItemButton>
                </ListItem>
              </List>
            </nav>
            <br />
            <div id={'footer'} style={{ marginTop: 'auto' }}>
              <FormControl fullWidth>
                <InputLabel id={'theme-label'}>Theme</InputLabel>
                <Select
                  labelId={'theme-label'}
                  id={'theme-select'}
                  value={preferredTheme}
                  label={'Theme'}
                  onChange={({ target: { value } }) =>
                    setPreferredTheme(value as THEME_PREFERENCE)
                  }
                >
                  <MenuItem value={'auto' as THEME_PREFERENCE}>
                    Follow System
                  </MenuItem>
                  <MenuItem value={'night' as THEME_PREFERENCE}>Dark</MenuItem>
                  <MenuItem value={'day' as THEME_PREFERENCE}>Light</MenuItem>
                </Select>
              </FormControl>
            </div>
          </Drawer>
        </AppBar>
        <div id={'outlet'} style={{ marginTop: '80px' }}>
          <Outlet />
        </div>
      </Themed>
    </LayoutContext.Provider>
  );
};
