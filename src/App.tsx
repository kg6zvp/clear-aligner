import './App.css';

import Workbench from 'workbench';

import './styles/theme.css';
import {AppBar, Drawer, IconButton, Toolbar, useMediaQuery} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import Themed from 'features/themed';
import {useMemo, useState} from "react";
import BCVNavigation from "./BCVNavigation/BCVNavigation";
import BCVWP, {parseFromString} from "./BCVWP/BCVWPSupport";
import {Corpus} from "./structs";
import {BCVDisplay} from "./BCVWP/BCVDisplay";

const corpora = [ // TODO: REMOVE MOCK DATA
  {
    id: '45005003001'
  },
  {
    id: '48006002001'
  }
] as Corpus[];

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
      () => prefersDarkMode ? 'night' : 'day',
      [prefersDarkMode]);

  const [showMenu, setShowMenu] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(parseFromString(corpora[0].id));

  return <>
    <Themed theme={theme}>
      <AppBar position={'static'} enableColorOnDark={theme !== 'night'}>
        <Toolbar aria-label={'Menu'} onClick={() => setShowMenu(!showMenu)}>
          <IconButton>
            <MenuIcon {...theme !== 'night' && {htmlColor: 'white'}} />
          </IconButton>
          <BCVDisplay currentPosition={currentPosition} />
        </Toolbar>
        <Drawer
          anchor={'left'}
          open={showMenu}
          onClose={() => setShowMenu(false)}>
          <BCVNavigation corpora={corpora} currentPosition={currentPosition ?? undefined} onNavigate={(selection) => {
            setCurrentPosition(selection);
            setShowMenu(false);
          }} />
        </Drawer>
      </AppBar>
      <Workbench corpora={corpora} currentPosition={currentPosition} />
    </Themed>
  </>;
}

export default App;
