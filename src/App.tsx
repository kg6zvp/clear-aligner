import './App.css';

import Workbench from 'workbench';

import './styles/theme.css';
import {AppBar, Drawer, IconButton, Toolbar, useMediaQuery} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import Themed from 'features/themed';
import React, {useMemo, useState} from "react";
import BCVNavigation from "./BCVNavigation/BCVNavigation";
import BCVWP, {parseFromString} from "./BCVWP/BCVWPSupport";
import {Corpus, SyntaxRoot, SyntaxType} from "./structs";
import {BCVDisplay} from "./BCVWP/BCVDisplay";
import {getAvailableCorpora, getAvailableCorporaIds, queryText} from "./workbench/query";
import fetchSyntaxData from "./workbench/fetchSyntaxData";
import placeholderTreedown from "./features/treedown/treedown.json";
import books from "./workbench/books";

const getRefParam = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
};

const getRefFromURL = (): BCVWP | null => {
  const refParam = getRefParam();

  if (refParam) {
    return parseFromString(refParam);
  }
  return null;
};

const defaultDocumentTitle = '🌲⬇️';

function App() {
  const [availableCorpora, setAvailableCorpora] = useState([] as Corpus[]);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
      () => prefersDarkMode ? 'night' : 'day',
      [prefersDarkMode]);

  const [showMenu, setShowMenu] = useState(false);

  const [syntaxData, setSyntaxData] = React.useState(
    placeholderTreedown as SyntaxRoot
  );

  document.title = getRefParam()
    ? `${defaultDocumentTitle} ${getRefParam()}`
    : defaultDocumentTitle;
  const [currentPosition, setCurrentPosition] = useState(getRefFromURL());

  React.useEffect(() => {
    const loadSyntaxData = async () => {
      try {
        const loadedSyntaxData = await fetchSyntaxData(currentPosition);
        if (loadedSyntaxData) {
          document.title = `${defaultDocumentTitle} ${
            currentPosition ? `${currentPosition?.getBookInfo()?.EnglishBookName} ${currentPosition?.chapter}:${currentPosition?.verse}` : ''}`;
        }

        const corporaIds = await getAvailableCorporaIds();
        const retrievedCorpora: Corpus[] = [];

        for (const corpusId of corporaIds) {
          const corpus = await queryText(corpusId, currentPosition);
          if (corpus) retrievedCorpora.push(corpus!);
        }

        // set the syntax
        retrievedCorpora.forEach((corpus) => {
          corpus.syntax = {...loadedSyntaxData as SyntaxRoot, _syntaxType: SyntaxType.Source};
        })

        setAvailableCorpora(retrievedCorpora);
      } catch (error) {
        console.error(error);
      }
    };

    loadSyntaxData().catch(console.error);
  }, [currentPosition, currentPosition?.book]);

  const corpora: Corpus[] = [];

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
          <BCVNavigation words={corpora?.[0]?.words} currentPosition={currentPosition ?? undefined} onNavigate={(selection) => {
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
