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
  Box,
  Grid
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
import { AppContext } from './App';

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

export const AppLayout = () => {
  const {appState} = useContext(AppContext);
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

  return (
    <LayoutContext.Provider value={layoutContext}>
      <Themed theme={theme}>
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
              {appState.currentProject?.name ?? ""}
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
