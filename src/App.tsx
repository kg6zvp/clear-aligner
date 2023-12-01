import './App.css';

import Workbench from 'workbench';

import './styles/theme.css';
import {AppBar, Drawer, IconButton, Toolbar, useMediaQuery} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import Themed from 'features/themed';
import React, {useMemo, useState} from "react";
import BCVNavigation from "./BCVNavigation/BCVNavigation";
import BCVWP, {parseFromString} from "./BCVWP/BCVWPSupport";
import {Corpus, SyntaxRoot, SyntaxType, Word} from "./structs";
import {BCVDisplay} from "./BCVWP/BCVDisplay";
import {getAvailableCorpora, getAvailableCorporaIds, queryText} from "./workbench/query";
import fetchSyntaxData from "./workbench/fetchSyntaxData";

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
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorpora, setSelectedCorpora] = useState([] as Corpus[]);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
      () => prefersDarkMode ? 'night' : 'day',
      [prefersDarkMode]);

  const [showMenu, setShowMenu] = useState(false);

  const [currentPosition, setCurrentPosition] = useState(getRefFromURL());

  React.useEffect(() => {
    if (currentPosition) {
      document.title = `${defaultDocumentTitle} ${currentPosition?.getBookInfo()?.EnglishBookName} ${currentPosition?.chapter}:${currentPosition?.verse}`;
    } else {
      document.title = defaultDocumentTitle;
    }
  },
    [currentPosition]);

  React.useEffect(() => {
    const loadSyntaxData = async () => {
      try {
        const loadedSyntaxData = await fetchSyntaxData(currentPosition);

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

        setSelectedCorpora(retrievedCorpora);
      } catch (error) {
        console.error(error);
      }
    };

    loadSyntaxData().catch(console.error);
  }, [currentPosition, currentPosition?.book, setSelectedCorpora]);

  React.useEffect(() => {
    const loadSourceWords = async () => {
      const corpus = (await getAvailableCorpora())[0];
      setAvailableWords(corpus?.words ?? []);
      setCurrentPosition(new BCVWP(45, 5, 3));
    };

    loadSourceWords().catch(console.error);
  }, [setAvailableWords]);

  return <>
    <Themed theme={theme}>
      <AppBar position={'static'} enableColorOnDark={theme !== 'night'}>
        <Toolbar aria-label={'Menu'} onClick={() => setShowMenu(!showMenu)}>
          <IconButton>
            <MenuIcon {...theme !== 'night' && {htmlColor: 'white'}} />
          </IconButton>
          <div onClick={() => setShowMenu(true)}>
            <BCVDisplay currentPosition={currentPosition} />
          </div>
        </Toolbar>
        <Drawer
          anchor={'left'}
          open={showMenu}
          onClose={() => setShowMenu(false)}>
          <BCVNavigation disabled={!availableWords || availableWords.length < 1} words={availableWords} currentPosition={currentPosition ?? undefined} onNavigate={(selection) => {
            setCurrentPosition(selection);
            setShowMenu(false);
          }} />
        </Drawer>
      </AppBar>
      <Workbench corpora={selectedCorpora} currentPosition={currentPosition} />
    </Themed>
  </>;
}

export default App;
