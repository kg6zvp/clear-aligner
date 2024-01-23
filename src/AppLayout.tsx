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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import React, { createContext, useMemo, useState } from 'react';
import Themed from './features/themed';
import {
  createSearchParams,
  Outlet,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { AddLink, ManageSearch } from '@mui/icons-material';

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
          <Toolbar aria-label={'Menu'} onClick={() => setShowMenu(!showMenu)}>
            <IconButton>
              <MenuIcon {...(theme !== 'night' && { htmlColor: 'white' })} />
            </IconButton>
            <div style={{ width: '100%' }} onClick={() => setShowMenu(true)}>
              {menuBarDelegate ?? <></>}
            </div>
          </Toolbar>
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
