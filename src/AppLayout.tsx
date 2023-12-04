import {
  AppBar,
  Checkbox,
  Drawer,
  FormControlLabel,
  IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar,
  useMediaQuery
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import React, {createContext, useMemo, useState} from "react";
import Themed from "./features/themed";
import {Link, Outlet} from "react-router-dom";
import {AddLink, ManageSearch} from "@mui/icons-material";

export interface LayoutContextProps {
  windowTitle: string;
  setWindowTitle: (title: string) => void;
  setMenuBarDelegate: React.Dispatch<React.SetStateAction<any>>;
}
export const LayoutContext = createContext({} as LayoutContextProps);

export const AppLayout = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const themeDefault = useMemo(
    () => prefersDarkMode ? 'night' : 'day',
    [prefersDarkMode]);

  const [ theme, setTheme ] = useState(themeDefault as 'night'|'day');

  const [showMenu, setShowMenu] = useState(false);
  const [menuBarDelegate, setMenuBarDelegate] = useState(null);
  const layoutContext: LayoutContextProps = useMemo(() => ({
    windowTitle: document.title,
    setWindowTitle: (title) => document.title = title,
    setMenuBarDelegate
  }), [setMenuBarDelegate]);

  return <LayoutContext.Provider value={layoutContext}>
    <Themed theme={theme}>
      <AppBar position={'static'} enableColorOnDark={theme !== 'night'}>
        <Toolbar aria-label={'Menu'} onClick={() => setShowMenu(!showMenu)}>
          <IconButton>
            <MenuIcon {...theme !== 'night' && {htmlColor: 'white'}} />
          </IconButton>
          <div onClick={() => setShowMenu(true)}>
            {menuBarDelegate ?? <></>}
          </div>
        </Toolbar>
        <Drawer
          anchor={'left'}
          open={showMenu}
          onClose={() => setShowMenu(false)}>
          <nav>
            <List>
              <ListItem disablePadding>
                <ListItemButton component={Link} to={'/'} onClick={() => setShowMenu(false)}>
                  <ListItemIcon>
                    <AddLink/>
                  </ListItemIcon>
                  <ListItemText primary={"Alignment Editor"} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component={Link} to={'/concordance'} onClick={() => setShowMenu(false)}>
                  <ListItemIcon>
                    <ManageSearch/>
                  </ListItemIcon>
                  <ListItemText primary={"Concordance View"} />
                </ListItemButton>
              </ListItem>
            </List>
          </nav>
          <br/>
          <div id={'footer'} style={{ marginTop: 'auto' }}>
            <FormControlLabel label={"Dark Mode"} control={<Checkbox checked={theme === 'night'} onChange={(e) => setTheme(e.target.checked ? 'night' : 'day')}/>}/>
          </div>
        </Drawer>
      </AppBar>
      <Outlet/>
    </Themed>
  </LayoutContext.Provider>
}
