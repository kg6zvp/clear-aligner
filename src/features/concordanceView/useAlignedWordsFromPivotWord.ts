import { AlignedWord, PivotWord } from './structs';
import { useContext, useEffect, useRef, useState } from 'react';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import {
  fullyResolveLink, generateWordListFromCorpusContainerAndLink, getLinksForPivotWord
} from './concordanceViewHelpers';
import { AppContext } from '../../App';

export const useAlignedWordsFromPivotWord = (pivotWord?: PivotWord): AlignedWord[] | undefined => {
  const {
    projectState: { linksTable }
  } = useContext(AppContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const [alignedWords, setAlignedWords] = useState<AlignedWord[] | undefined>(pivotWord?.alignedWords);
  const setAlignedWordsRef = useRef(setAlignedWords);

  useEffect(() => {
    setAlignedWordsRef.current = setAlignedWords;
  }, [setAlignedWordsRef, setAlignedWords]);

  useEffect(() => {
      setAlignedWords(pivotWord?.alignedWords);
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [setAlignedWords, pivotWord, pivotWord?.alignedWords, pivotWord?.alignedWords?.length]);

  useEffect(() => {
    if (pivotWord?.alignedWords) {
      setAlignedWordsRef.current(pivotWord.alignedWords);
      return;
    }

    const loadAlignedWords = async () => {
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          if (!sourceContainer || !targetContainer || !pivotWord || !linksTable) {
            resolve();
            return;
          }

          if (!pivotWord.alignmentLinks) {
            await getLinksForPivotWord(linksTable, pivotWord);
          }

          const links = pivotWord.alignmentLinks!.map((link) => fullyResolveLink(link, sourceContainer, targetContainer));

          const alignedWordsPromises = links.map(async (link): Promise<AlignedWord> => {
            const key = [...generateWordListFromCorpusContainerAndLink(link, 'sources'), ...generateWordListFromCorpusContainerAndLink(link, 'targets')].join(',');
            return {
              id: key,
              frequency: 1,
              sourceWordTexts: Array.from(link.sourceResolvedWords).map((word) => word.localized),
              targetWordTexts: Array.from(link.targetResolvedWords).map((word) => word.localized),
              sourceTextId: Array.from(link.sourceResolvedWords).find((w) => !!w.word.corpusId)?.word.corpusId ?? '',
              targetTextId: Array.from(link.targetResolvedWords).find((w) => !!w.word.corpusId)?.word.corpusId ?? '',
              alignments: [link]
            };
          });

          const alignedWordsMap = (await Promise.all(alignedWordsPromises)).reduce((accumulator, currentValue) => {
            if (accumulator[currentValue.id]) {
              accumulator[currentValue.id].alignments = [...(accumulator[currentValue.id].alignments ?? []), ...(currentValue.alignments ?? [])];
              accumulator[currentValue.id].frequency = accumulator[currentValue.id].alignments!.length;
            } else {
              accumulator[currentValue.id] = currentValue;
            }
            return accumulator;
          }, {} as { [key: string]: AlignedWord });

          const newAlignedWords = Object.values(alignedWordsMap);
          setAlignedWordsRef.current(newAlignedWords);
          pivotWord.alignedWords = newAlignedWords;
          resolve();
        }, 2);
      });
    };

    void loadAlignedWords();
  }, [pivotWord, linksTable, sourceContainer, targetContainer, setAlignedWordsRef]);

  return alignedWords;
};
