import { AlignedWord, PivotWord } from './structs';
import { useEffect, useState } from 'react';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { fullyResolveLink, generateWordListFromCorpusContainerAndLink } from './concordanceViewHelpers';

export const useAlignedWordsFromPivotWord = (pivotWord: PivotWord|null): AlignedWord[]|null => {
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const setAlignedWords = useState(null as AlignedWord[]|null)[1];

  useEffect(() => {
    const loadAlignedWords = async () => {
      if (!sourceContainer || !targetContainer) return;
      if(!pivotWord || !pivotWord.alignmentLinks) return;
      if (pivotWord?.alignedWords) {
        setAlignedWords(pivotWord.alignedWords);
        return;
      }

      const links = pivotWord.alignmentLinks.map((link) => fullyResolveLink(link, sourceContainer, targetContainer));

      const words = links
        .map((link): AlignedWord => {
          const key = [
            ...generateWordListFromCorpusContainerAndLink(link, 'sources'),
            ...generateWordListFromCorpusContainerAndLink(link, 'targets') ].join(',');
          return {
            id: key,
            frequency: 1,
            sourceWordTexts: Array.from(link.sourceResolvedWords).map((word) => word.localized),
            targetWordTexts: Array.from(link.targetResolvedWords).map((word) => word.localized),
            sourceTextId: Array.from(link.sourceResolvedWords).find(w => !!w.word.corpusId)?.word.corpusId ?? '',
            targetTextId: Array.from(link.targetResolvedWords).find(w => !!w.word.corpusId)?.word.corpusId ?? '',
            alignments: [ link ]
          }
        })
        .reduce((accumulator, currentValue) => {
          if (accumulator[currentValue.id]) {
            accumulator[currentValue.id].alignments = [ ...(accumulator[currentValue.id].alignments ?? []), ...(currentValue.alignments ?? []) ];
            accumulator[currentValue.id].frequency = accumulator[currentValue.id].alignments!.length;
          } else {
            accumulator[currentValue.id] = currentValue;
          }
          return accumulator;
        }, {} as { [key: string]: AlignedWord });

      pivotWord.alignedWords = Object.values(words);
      setAlignedWords(pivotWord.alignedWords);
    };

    void loadAlignedWords();
  }, [pivotWord, pivotWord?.alignedWords, sourceContainer, targetContainer, setAlignedWords]);

  return pivotWord?.alignedWords ?? null;
}
