import { AlignedWord, PivotWord } from './structs';
import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../App';
import { useDatabase } from '../../hooks/useDatabase';
import { DefaultProjectName } from '../../state/links/tableManager';
import { GridSortItem } from '@mui/x-data-grid';
import { useLanguages } from '../../hooks/useLanguages';

export const useAlignedWordsFromPivotWord = (pivotWord?: PivotWord, sort?: GridSortItem|null): AlignedWord[] | undefined => {
  const {
    projectState: { linksTable }
  } = useContext(AppContext);
  const languages = useLanguages();
  const db = useDatabase();
  const [alignedWords, setAlignedWords] = useState<AlignedWord[] | undefined>(undefined);
  const setAlignedWordsRef = useRef(setAlignedWords);

  useEffect(() => {
    setAlignedWordsRef.current = setAlignedWords;
  }, [setAlignedWordsRef, setAlignedWords]);

  useEffect(() => {
    if (!pivotWord || !languages) return;
    const load = async () => {
      const alignedWords = (await db.corporaGetAlignedWordsByPivotWord(DefaultProjectName, pivotWord.side, pivotWord.normalizedText, sort))
                                            .map((aw): AlignedWord => {
                                              return {
                                                id: `${aw.t}:${aw.st}-${aw.tt}`,
                                                sourceWordTexts: {
                                                  languageInfo: languages.get(aw.sl),
                                                  text: aw.st
                                                },
                                                targetWordTexts: {
                                                  languageInfo: languages.get(aw.tl),
                                                  text: aw.tt
                                                },
                                                frequency: aw.c
                                              }
                                            });
      setAlignedWords(alignedWords);
    };

    void load();
  }, [setAlignedWords, pivotWord, languages]);

  return alignedWords;
};
